import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { demoFor, photoFallback } from '../gifs';
import { COLORS, FONT } from '../theme';

// Why this component exists:
//
// expo-image reuses one native view when only `source` changes, and by design it
// keeps the PREVIOUS image on screen until the next one has decoded. In the web
// preview the same markup is a CSS background on a div that React re-creates, so
// a swap looks instant — on device, stepping to the next exercise left the old
// exercise's GIF animating, sometimes indefinitely if the new file was slow or
// failed. `recyclingKey` is expo-image's own opt-out of that behaviour, and the
// `key` makes React mount a fresh component per demo on top of it. The canvas
// fixes the same bug with key={gifUrl} on its div.
export function DemoImage({ name }: { name: string }) {
  const demo = demoFor(name);
  // state is keyed by demo, so a new exercise never inherits the old one's status
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(
    demo.kind === 'bundled' ? 'ok' : 'loading'
  );
  useEffect(() => {
    setStatus(demo.kind === 'bundled' ? 'ok' : 'loading');
  }, [demo.key, demo.kind]);

  if (demo.kind === 'none') return <Empty text="NO DEMO GIF FOR THIS MOVE" />;

  if (demo.kind === 'bundled') {
    return (
      <View style={{ position: 'relative' }}>
        <Image
          key={demo.key}
          recyclingKey={demo.key}
          source={demo.module}
          style={styles.demo}
          contentFit="contain"
          transition={0}
          accessibilityLabel={name}
        />
        <Text style={styles.tag}>BUNDLED</Text>
      </View>
    );
  }

  if (demo.kind === 'pair') return <PhotoPair id={demo.key} a={demo.a} b={demo.b} />;

  // a failed GIF falls back to the still photos when the move has them, and
  // otherwise reads as "no demo" rather than leaving the last one up
  if (status === 'error') {
    const alt = photoFallback(name);
    if (alt) return <PhotoPair id={'alt:' + demo.key} a={alt.a} b={alt.b} />;
    return <Empty text="DEMO UNAVAILABLE OFFLINE" />;
  }

  return (
    <View style={{ position: 'relative' }}>
      <Image
        key={demo.key}
        recyclingKey={demo.key}
        source={{ uri: demo.uri }}
        style={styles.demo}
        contentFit="contain"
        transition={0}
        cachePolicy="disk"
        accessibilityLabel={name}
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('error')}
      />
      {status === 'loading' && (
        <View style={styles.cover}>
          <Text style={styles.coverText}>LOADING DEMO…</Text>
        </View>
      )}
      {status === 'ok' && <Text style={styles.tag}>{demo.source}</Text>}
    </View>
  );
}

function PhotoPair({ id, a, b }: { id: string; a: string; b: string }) {
  return (
    <View key={id} style={styles.pair}>
      <Image recyclingKey={id + '0'} source={{ uri: a }} style={styles.photo} contentFit="cover" transition={0} cachePolicy="disk" />
      <Image recyclingKey={id + '1'} source={{ uri: b }} style={styles.photo} contentFit="cover" transition={0} cachePolicy="disk" />
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// warm the neighbouring cards so stepping forward lands on a decoded demo
export function prefetchDemos(names: string[]): void {
  const uris = names
    .map((n) => demoFor(n))
    .reduce<string[]>((acc, d) => {
      if (d.kind === 'gif') acc.push(d.uri);
      if (d.kind === 'pair') acc.push(d.a, d.b);
      return acc;
    }, []);
  if (uris.length) Image.prefetch(uris, { cachePolicy: 'disk' }).catch(() => {});
}

const styles = StyleSheet.create({
  demo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: '#fff' },
  pair: { flexDirection: 'row', gap: 2, borderRadius: 14, overflow: 'hidden' },
  photo: { flex: 1, aspectRatio: 3 / 4, backgroundColor: '#222' },
  empty: { height: 120, borderRadius: 14, backgroundColor: COLORS.inner, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.5, color: COLORS.paperFaint },
  cover: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: COLORS.inner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: { fontFamily: FONT.condensed700, fontSize: 11, letterSpacing: 1.5, color: COLORS.paperFaint },
  tag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    fontFamily: FONT.condensed700,
    fontSize: 9,
    letterSpacing: 1.1,
    color: 'rgba(11,13,16,0.6)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 5,
    overflow: 'hidden',
  },
});
