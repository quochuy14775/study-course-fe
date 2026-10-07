import type { CodeExercise } from '../types/codeExercise';

/** Bài tập mẫu để xem UI — sẽ thay bằng GET /lessons/{id}/exercise khi có BE. */
export const mockExercises: CodeExercise[] = [
    {
        id: 1,
        title: 'Tổng các phần tử trong mảng',
        language: 'typescript',
        fileName: 'sum.ts',
        prompt: `Viết hàm \`sum(numbers)\` nhận vào một mảng số và trả về tổng của chúng.

Mảng rỗng trả về \`0\`. Không dùng vòng lặp \`for\` — hãy thử \`reduce\`.

\`\`\`ts
sum([1, 2, 3]) // 6
sum([])        // 0
\`\`\``,
        starterCode: `export function sum(numbers: number[]): number {
  // TODO: dùng reduce để cộng dồn
  return 0;
}
`,
        tests: [
            { name: 'Mảng 3 phần tử', call: 'sum([1, 2, 3])', expected: '6' },
            { name: 'Mảng rỗng', call: 'sum([])', expected: '0' },
            { name: 'Có số âm', call: 'sum([10, -4, 2.5])', expected: '8.5' },
            { name: 'Mảng lớn', call: 'sum(Array.from({ length: 100 }, (_, i) => i + 1))', expected: '5050', hidden: true },
        ],
        hints: ['`numbers.reduce((acc, n) => acc + n, 0)` — giá trị khởi tạo `0` xử lý luôn mảng rỗng.'],
    },
    {
        id: 2,
        title: 'Đảo ngược chuỗi',
        language: 'javascript',
        fileName: 'reverse.js',
        prompt: `Viết hàm \`reverse(str)\` trả về chuỗi đảo ngược.

Giữ nguyên chữ hoa/thường và dấu tiếng Việt.

\`\`\`js
reverse("abc")   // "cba"
reverse("EduHub") // "buHudE"
\`\`\``,
        starterCode: `function reverse(str) {
  // TODO
  return str;
}
`,
        tests: [
            { name: 'Chuỗi thường', call: 'reverse("abc")', expected: '"cba"' },
            { name: 'Chữ hoa/thường', call: 'reverse("EduHub")', expected: '"buHudE"' },
            { name: 'Chuỗi rỗng', call: 'reverse("")', expected: '""' },
            { name: 'Có dấu', call: 'reverse("xin chào")', expected: '"oàhc nix"', hidden: true },
        ],
        hints: ['`[...str]` tách chuỗi thành mảng ký tự an toàn với Unicode, rồi `.reverse().join("")`.'],
    },
    {
        id: 3,
        title: 'Đếm nguyên âm',
        language: 'python',
        fileName: 'vowels.py',
        prompt: `Viết hàm \`count_vowels(s)\` đếm số nguyên âm (a, e, i, o, u) trong chuỗi, không phân biệt hoa thường.

\`\`\`python
count_vowels("Hello World")  # 3
count_vowels("PYTHON")       # 1
\`\`\``,
        starterCode: `def count_vowels(s: str) -> int:
    # TODO
    return 0
`,
        tests: [
            { name: 'Câu đơn giản', call: 'count_vowels("Hello World")', expected: '3' },
            { name: 'Chữ hoa', call: 'count_vowels("PYTHON")', expected: '1' },
            { name: 'Không có nguyên âm', call: 'count_vowels("rhythm")', expected: '0' },
            { name: 'Chuỗi dài', call: 'count_vowels("the quick brown fox jumps over the lazy dog")', expected: '11', hidden: true },
        ],
        hints: ['`sum(1 for ch in s.lower() if ch in "aeiou")`'],
    },
];
