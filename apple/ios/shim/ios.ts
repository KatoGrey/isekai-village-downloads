// Isekai Village for iPhone and iPad: what the phone needs that a browser tab doesn't. Loaded before the game.
// - "Save to a .isekai file": a web view can't download, so the file goes to the share sheet (Files, AirDrop, a chat...).
// (The game sits inside the safe area, clear of the notch and the home bar: GameViewController.swift.)
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

if (Capacitor.isNativePlatform()) {
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (!this.download || !this.href.startsWith('blob:')) return click.call(this);
    const name = this.download;
    void fetch(this.href)
      .then((r) => r.text())
      .then(async (data) => {
        const { uri } = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: name, files: [uri], dialogTitle: 'Keep your town somewhere safe' });
      })
      .catch((e) => console.warn('Saving the town file failed', e));
  };
}
