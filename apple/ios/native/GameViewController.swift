import UIKit
import Capacitor

/// Isekai Village for iPhone and iPad: the game's web view sits inside the safe area (clear of the notch, the camera and
/// the home bar) on the game's own dark colour, as the Android app does around a camera hole. The status bar stays
/// hidden, the home bar fades, and a swipe up from the bottom edge asks twice before it leaves the game.
class GameViewController: UIViewController {
    private let game = CAPBridgeViewController()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 42 / 255, green: 34 / 255, blue: 51 / 255, alpha: 1)
        addChild(game)
        game.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(game.view)
        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            game.view.topAnchor.constraint(equalTo: safe.topAnchor),
            game.view.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
            game.view.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            game.view.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
        ])
        game.didMove(toParent: self)
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { [.bottom] }
}
