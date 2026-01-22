import Foundation
import ScreenCaptureKit
import AVFoundation

@main
struct CaptureApp {
    static func main() async throws {

        let content = try await SCShareableContent.current
        guard let display = content.displays.first else {
            fatalError("No display")
        }

        let filter = SCContentFilter(display: display, excludingWindows: [])
        let config = SCStreamConfiguration()
        config.width = display.width
        config.height = display.height
        config.minimumFrameInterval = CMTime(value: 1, timescale: 15)
        config.queueDepth = 5

        let output = FrameOutput()
        let stream = SCStream(filter: filter, configuration: config, delegate: nil)

        try stream.addStreamOutput(
            output,
            type: .screen,
            sampleHandlerQueue: DispatchQueue(label: "frame.queue")
        )

        try await stream.startCapture()
        fputs("READY\n", stderr) // Node waits for this

        try await Task.sleep(nanoseconds: .max)
    }
}