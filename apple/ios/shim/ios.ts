// Isekai Village for iPhone and iPad: what the phone needs that a browser tab doesn't. Loaded before the game.
// - "Save to a .isekai file": a web view can't download, so the file goes to the share sheet (Files, AirDrop, a chat...).
// - The game's "Game updates" card (v129 on): whether a newer version is out, and the downloads page. A sideloaded app
//   can't install its own update, so this bridge only looks; the player installs the new ipa as they did this one.
// (The game sits inside the safe area, clear of the notch and the home bar: GameViewController.swift.)
import { Capacitor, CapacitorHttp } from '@capacitor/core';
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

  const REPO = 'KatoGrey/isekai-village-downloads';
  const byHand = () => Promise.reject(new Error('the iPhone app updates from the downloads page'));
  (window as unknown as { isekaiUpdater: unknown }).isekaiUpdater = {
    platform: 'ios',
    info: async () => ({ kind: 'ios', version: '' }),
    // (Asked natively, so the web view's cross-origin rules don't come into it.)
    check: async () => {
      const res = await CapacitorHttp.get({ url: `https://api.github.com/repos/${REPO}/releases/latest`, headers: { Accept: 'application/vnd.github+json' } });
      if (res.status < 200 || res.status >= 300) throw new Error(`GitHub answered ${res.status}`);
      const j = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) ?? {};
      return {
        tag: String(j.tag_name ?? ''), name: String(j.name ?? ''), body: String(j.body ?? ''), url: String(j.html_url ?? ''),
        assets: ((j.assets ?? []) as { name: unknown; browser_download_url: unknown; size: unknown }[]).map((a) => ({ name: String(a.name), url: String(a.browser_download_url), size: Number(a.size) || 0 })),
      };
    },
    download: byHand,
    install: byHand,
    // (A link out of the app opens in Safari.)
    openPage: (url: string) => { if (String(url).startsWith(`https://github.com/${REPO}`)) window.open(url, '_blank'); },
  };
}
