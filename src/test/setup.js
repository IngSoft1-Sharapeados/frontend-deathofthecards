import '@testing-library/jest-dom';

// Mock scrollIntoView globally for all tests
Element.prototype.scrollIntoView = () => {};
