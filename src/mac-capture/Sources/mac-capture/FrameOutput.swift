import ScreenCaptureKit
import AVFoundation
import ImageIO
import CoreImage

final class FrameOutput: NSObject, SCStreamOutput {

    private let ciContext = CIContext()
    private let stdout = FileHandle.standardOutput

    func stream(
        _ stream: SCStream,
        didOutputSampleBuffer sampleBuffer: CMSampleBuffer,
        of type: SCStreamOutputType
    ) {
        guard type == .screen,
              let imageBuffer = sampleBuffer.imageBuffer else { return }

        let ciImage = CIImage(cvImageBuffer: imageBuffer)

        guard let cgImage = ciContext.createCGImage(
            ciImage,
            from: ciImage.extent
        ) else { return }

        let data = NSMutableData()
        guard let dest = CGImageDestinationCreateWithData(
            data,
            UTType.jpeg.identifier as CFString,
            1,
            nil
        ) else { return }

        CGImageDestinationAddImage(
            dest,
            cgImage,
            [kCGImageDestinationLossyCompressionQuality: 0.7] as CFDictionary
        )

        CGImageDestinationFinalize(dest)

        // 🔥 Length‑prefixed frame (important!)
        var length = UInt32(data.length).bigEndian
        stdout.write(Data(bytes: &length, count: 4))
        stdout.write(data as Data)
    }
}
