import { describe, it, expect } from 'vitest';
import { isValidDetectiveSet } from './detectiveSetValidation';

// Helper to build hand cards
const card = (id, instanceId) => ({ id, instanceId, url: `${id}.png` });

describe('isValidDetectiveSet', () => {
	it('rejects non-detective cards', () => {
		const hand = [card(16, 'a'), card(7, 'b')]; // 16 is not detective
		expect(isValidDetectiveSet(hand, ['a', 'b'])).toBe(false);
	});

	it('validates 2-of-a-kind detectives', () => {
		const hand = [card(9, 'a'), card(9, 'b')]; // Mr Satterthwaite requires 2
		expect(isValidDetectiveSet(hand, ['a', 'b'])).toBe(true);
	});

	it('validates 2 with wildcard for 2-size sets', () => {
		const hand = [card(10, 'a'), card(14, 'w')]; // Parker Pyne + wildcard
		expect(isValidDetectiveSet(hand, ['a', 'w'])).toBe(true);
	});

	it('rejects 2 with wildcard for 3-size sets', () => {
		const hand = [card(7, 'a'), card(14, 'w')]; // Poirot needs 3
		expect(isValidDetectiveSet(hand, ['a', 'w'])).toBe(false);
	});

	it('validates Tommy + Tuppence pair', () => {
		const hand = [card(12, 't'), card(13, 'u')];
		expect(isValidDetectiveSet(hand, ['t', 'u'])).toBe(true);
	});

	it('validates 3-of-a-kind detectives', () => {
		const hand = [card(8, 'a'), card(8, 'b'), card(8, 'c')]; // Miss Marple requires 3
		expect(isValidDetectiveSet(hand, ['a', 'b', 'c'])).toBe(true);
	});

	it('validates 2 + wildcard for 3-size sets', () => {
		const hand = [card(7, 'a'), card(7, 'b'), card(14, 'w')];
		expect(isValidDetectiveSet(hand, ['a', 'b', 'w'])).toBe(true);
	});

	it('validates 1 + 2 wildcards for 3-size sets', () => {
		const hand = [card(8, 'a'), card(14, 'w1'), card(14, 'w2')];
		expect(isValidDetectiveSet(hand, ['a', 'w1', 'w2'])).toBe(true);
	});

	it('rejects mixed non-wildcards in 3-size sets', () => {
		const hand = [card(7, 'a'), card(8, 'b'), card(14, 'w')];
		expect(isValidDetectiveSet(hand, ['a', 'b', 'w'])).toBe(false);
	});
});
