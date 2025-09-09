/**
 * Test the status conversion functionality
 */

// Import the conversion function (you might need to export it from sidebarApiCalls.ts)
import { STATUS_MAP } from './sidebarApiCalls';

// Test cases for status conversion
const testCases = [
    { input: 'freshform', expected: '9' },
    { input: 'final', expected: '7' },
    { input: 'finaldisposal', expected: '7' },
    { input: ['freshform'], expected: '9' },
    { input: ['final'], expected: '7' },
    { input: ['freshform', 'final'], expected: '9,7' },
    { input: [9], expected: '9' },
    { input: ['9'], expected: '9' },
    { input: [9, 7], expected: '9,7' },
];

// Mock console.warn to track warnings
const originalWarn = console.warn;
const warnings: string[] = [];
console.warn = (message: string) => {
    warnings.push(message);
};

// Simple conversion function for testing (copy from sidebarApiCalls.ts)
const convertStatusNamesToIds = (statusIds: string | string[] | number | number[]): string => {
    if (!statusIds) return '';

    const statusArray = Array.isArray(statusIds) ? statusIds : [statusIds];
    const numericIds: number[] = [];

    statusArray.forEach(status => {
        // If already numeric, keep it
        if (typeof status === 'number' || !isNaN(Number(status))) {
            numericIds.push(Number(status));
        } else {
            // Map status name to numeric IDs
            const mappedIds = STATUS_MAP[String(status).toLowerCase() as keyof typeof STATUS_MAP];
            if (mappedIds) {
                numericIds.push(...mappedIds);
            } else {
                console.warn(`⚠️ Unknown status name: ${status}`);
            }
        }
    });

    return numericIds.join(',');
};

// Run tests
console.log('🧪 Testing status conversion...');
testCases.forEach((testCase, index) => {
    const result = convertStatusNamesToIds(testCase.input);
    const passed = result === testCase.expected;
    console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Input: ${JSON.stringify(testCase.input)}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    if (!passed) {
        console.log(`  ❌ TEST FAILED`);
    }
    console.log('');
});

// Test unknown status
console.log('Testing unknown status:');
const unknownResult = convertStatusNamesToIds('unknown_status');
console.log(`Unknown status result: "${unknownResult}"`);
console.log(`Warnings generated: ${warnings.length}`);
warnings.forEach(warning => console.log(`  Warning: ${warning}`));

// Restore console.warn
console.warn = originalWarn;

console.log('🧪 Status conversion tests completed!');
