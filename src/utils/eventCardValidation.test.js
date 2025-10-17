import { describe, it, expect } from 'vitest';
import { isValidEventCard } from './eventCardValidation';

// helper to create card objects
const card = (id, instanceId) => ({ id, instanceId, url: `${id}.png` });

describe('isValidEventCard', () => {
	it('rejects if hand or selectedInstanceIds are not arrays', () => {
		expect(isValidEventCard(null, ['a'])).toBe(false);
		expect(isValidEventCard([], null)).toBe(false);
	});

	it('rejects if more than one card is selected', () => {
		const hand = [card(17, 'a'), card(18, 'b')];
		expect(isValidEventCard(hand, ['a', 'b'])).toBe(false);
	});

	it('rejects if no card is selected', () => {
		const hand = [card(17, 'a')];
		expect(isValidEventCard(hand, [])).toBe(false);
	});

	it('rejects if selected card not found in hand', () => {
		const hand = [card(17, 'a')];
		expect(isValidEventCard(hand, ['x'])).toBe(false);
	});

	it('rejects if selected card is not an event card', () => {
		const hand = [card(10, 'a')]; // 10 not in EVENT_IDS
		expect(isValidEventCard(hand, ['a'])).toBe(false);
	});

	it('accepts valid single event card', () => {
		const hand = [card(17, 'a')]; // 17 is in EVENT_IDS
		expect(isValidEventCard(hand, ['a'])).toBe(true);
	});

	it('accepts valid event card even if hand has other non-event cards', () => {
		const hand = [card(5, 'x'), card(18, 'a'), card(9, 'y')];
		expect(isValidEventCard(hand, ['a'])).toBe(true);
	});

	it('rejects if event card duplicated selection', () => {
		const hand = [card(17, 'a'), card(17, 'b')];
		expect(isValidEventCard(hand, ['a', 'b'])).toBe(false);
	});

	it('rejects if selected card missing from EVENT_IDS', () => {
		const hand = [card(30, 'z')];
		expect(isValidEventCard(hand, ['z'])).toBe(false);
	});

	it('handles multiple valid event cards but only one selected', () => {
		const hand = [card(17, 'a'), card(18, 'b'), card(19, 'c')];
		expect(isValidEventCard(hand, ['b'])).toBe(true);
	});
});
