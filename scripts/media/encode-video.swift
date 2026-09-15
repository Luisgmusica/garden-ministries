// Web encode for testimony / mission videos (macOS, no third-party tools).
//
//   swiftc -O -o /tmp/encode-video scripts/media/encode-video.swift
//   /tmp/encode-video <input> <output.mp4> <maxLongEdge px> <video kbps>
//
// Output: H.264 High, MP4 with the moov atom first (fast start), SDR BT.709 (HDR/HLG sources are
// tone-mapped by the video composition), AAC 96 kbps stereo, keyframe at least every 2 s.
// Never upscales; never overwrites the input. Loudness is not normalized — check levels by ear.
import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count == 5, let maxEdge = Double(args[3]), let kbps = Int(args[4]) else {
  FileHandle.standardError.write("usage: encode-video <input> <output.mp4> <maxLongEdge> <videoKbps>\n".data(using: .utf8)!)
  exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
guard inURL.standardizedFileURL != outURL.standardizedFileURL else { print("refusing to overwrite the input"); exit(2) }
try? FileManager.default.removeItem(at: outURL)

func encode() async throws {
  let asset = AVURLAsset(url: inURL)
  let videoTrack = try await asset.loadTracks(withMediaType: .video)[0]
  let audioTrack = try await asset.loadTracks(withMediaType: .audio).first
  let duration = try await asset.load(.duration)
  let natural = try await videoTrack.load(.naturalSize)
  let transform = try await videoTrack.load(.preferredTransform)

  let display = natural.applying(transform)
  let scale = min(1.0, maxEdge / max(abs(display.width), abs(display.height)))
  let width = Int((abs(display.width) * scale / 2).rounded()) * 2
  let height = Int((abs(display.height) * scale / 2).rounded()) * 2

  let composition = try await AVMutableVideoComposition.videoComposition(withPropertiesOf: asset)
  composition.renderSize = CGSize(width: width, height: height)
  composition.colorPrimaries = AVVideoColorPrimaries_ITU_R_709_2
  composition.colorTransferFunction = AVVideoTransferFunction_ITU_R_709_2
  composition.colorYCbCrMatrix = AVVideoYCbCrMatrix_ITU_R_709_2
  let instruction = AVMutableVideoCompositionInstruction()
  instruction.timeRange = CMTimeRange(start: .zero, duration: duration)
  let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
  layer.setTransform(transform.concatenating(CGAffineTransform(scaleX: scale, y: scale)), at: .zero)
  instruction.layerInstructions = [layer]
  composition.instructions = [instruction]

  let reader = try AVAssetReader(asset: asset)
  let videoOut = AVAssetReaderVideoCompositionOutput(
    videoTracks: [videoTrack], videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
  videoOut.videoComposition = composition
  reader.add(videoOut)
  var audioOut: AVAssetReaderTrackOutput?
  if let audioTrack {
    let out = AVAssetReaderTrackOutput(track: audioTrack, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM])
    reader.add(out)
    audioOut = out
  }

  let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
  writer.shouldOptimizeForNetworkUse = true
  let videoIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoColorPropertiesKey: [
      AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
      AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
      AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ],
    AVVideoCompressionPropertiesKey: [
      AVVideoAverageBitRateKey: kbps * 1000,
      AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
      AVVideoMaxKeyFrameIntervalDurationKey: 2,
    ],
  ])
  videoIn.expectsMediaDataInRealTime = false
  writer.add(videoIn)
  var audioIn: AVAssetWriterInput?
  if audioOut != nil {
    let input = AVAssetWriterInput(mediaType: .audio, outputSettings: [
      AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 44100, AVNumberOfChannelsKey: 2, AVEncoderBitRateKey: 96000,
    ])
    writer.add(input)
    audioIn = input
  }

  reader.startReading()
  writer.startWriting()
  writer.startSession(atSourceTime: .zero)

  await withTaskGroup(of: Void.self) { group in
    func pump(_ input: AVAssetWriterInput, _ output: AVAssetReaderOutput, _ label: String) {
      group.addTask {
        await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
          input.requestMediaDataWhenReady(on: DispatchQueue(label: label)) {
            while input.isReadyForMoreMediaData {
              if let sample = output.copyNextSampleBuffer() {
                input.append(sample)
              } else {
                input.markAsFinished()
                done.resume()
                return
              }
            }
          }
        }
      }
    }
    pump(videoIn, videoOut, "video")
    if let audioIn, let audioOut { pump(audioIn, audioOut, "audio") }
  }
  await writer.finishWriting()
  guard writer.status == .completed else { throw writer.error ?? NSError(domain: "encode", code: 1) }

  let bytes = (try FileManager.default.attributesOfItem(atPath: outURL.path)[.size] as? Int) ?? 0
  print("\(outURL.lastPathComponent): \(width)x\(height), \(kbps) kbps, \(String(format: "%.2f", Double(bytes) / 1_000_000)) MB")
}

let done = DispatchSemaphore(value: 0)
Task {
  do { try await encode() } catch { print("encode failed: \(error)"); exit(1) }
  done.signal()
}
done.wait()
