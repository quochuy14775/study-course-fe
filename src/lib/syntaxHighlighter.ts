import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';

/**
 * Entry `react-syntax-highlighter` mặc định nhúng toàn bộ ~300 ngôn ngữ của refractor
 * (~250kB gzip). PrismLight chỉ nạp những ngôn ngữ đăng ký ở đây — khớp với LANG_OPTIONS
 * của trình soạn bài viết. Alias đi kèm sẵn: js, ts, sh, html, xml, py, cs, md…
 * Ngôn ngữ chưa đăng ký vẫn hiển thị được, chỉ là không tô màu.
 */
[markup, css, javascript, typescript, jsx, tsx, python, java, csharp, cpp, go, rust, bash, sql, json, yaml, markdown]
    .forEach((lang) => SyntaxHighlighter.registerLanguage(lang.displayName, lang));

export { SyntaxHighlighter };
export { default as codeTheme } from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
