import assert from 'node:assert/strict';
import { framePosition, progressAt, annotationOpacity, chapterAt, desktopStops, mobileStops } from '../src/lib/technology.ts';
for (const stops of [desktopStops, mobileStops]) {
  let previous = -1;
  for (let i=0; i<=10000; i++) {
    const frame = framePosition(i/10000, stops);
    assert.ok(frame >= previous && frame >= 0 && frame <= 106);
    assert.ok(chapterAt(frame) >= 0);
    assert.ok(annotationOpacity(frame) >= 0 && annotationOpacity(frame) <= 1);
    previous = frame;
  }
  for(let frame=0; frame<=106; frame+=.25) assert.ok(Math.abs(framePosition(progressAt(frame, stops), stops)-frame)<.00001);
  for (const [p, frame] of stops) assert.ok(Math.abs(framePosition(p, stops)-frame)<.00001);
}
console.log('PASS: monotone curves, exact stops, 425 reversible positions, bounded annotations.');
const { restingFrame, chapters } = await import('../src/lib/technology.ts');
const anchors = chapters.map(chapter => chapter.frame);
for (let frame=0; frame<=106; frame+=.125) {
  const rest = restingFrame(frame);
  assert.ok(anchors.includes(rest));
  assert.equal(annotationOpacity(rest), 1, 'Rest has fully readable annotation');
  assert.ok(anchors.every(anchor => Math.abs(rest-frame) <= Math.abs(anchor-frame)));
}
for (const frame of anchors) assert.equal(restingFrame(frame), frame);
assert.equal(restingFrame(74), 83, 'Phone transition settles on the whole phone');
assert.equal(restingFrame(96), 106, 'Cloud transition settles on the overview');
console.log('PASS: every transition settles on a readable inspected pose.');
for (const stops of [desktopStops, mobileStops]) {
  for (let p=0; p<=1; p+=.01) {
    const rest = restingFrame(framePosition(p, stops), stops);
    assert.ok(anchors.includes(rest));
    assert.ok(anchors.every(anchor => Math.abs(progressAt(rest, stops)-p) <= Math.abs(progressAt(anchor, stops)-p)+1e-8));
  }
}
assert.equal(restingFrame(framePosition(.60, desktopStops), desktopStops), 60, 'A backward PageUp from the phone can reach optics');
console.log('PASS: snapping uses scroll distance including phone reading space.');
for (const stops of [desktopStops, mobileStops]) {
  for (let frame=.25; frame<106; frame+=.25) {
    const forward = restingFrame(frame, stops, 1);
    const backward = restingFrame(frame, stops, -1);
    assert.ok(anchors.includes(forward) && anchors.includes(backward));
    assert.ok(forward >= frame || Math.abs(progressAt(forward, stops)-progressAt(frame, stops)) <= .0003);
    assert.ok(backward <= frame || Math.abs(progressAt(backward, stops)-progressAt(frame, stops)) <= .0003);
  }
  for (const anchor of anchors) {
    assert.equal(restingFrame(anchor, stops, 1), anchor);
    assert.equal(restingFrame(anchor, stops, -1), anchor);
  }
  assert.equal(restingFrame(3, stops, 1), 31, 'A short downward gesture advances rather than returning to 0');
  assert.equal(restingFrame(35, stops, 1), 60);
  assert.equal(restingFrame(57, stops, -1), 31);
}
console.log('PASS: short gestures settle in their direction; anchors remain stable.');
