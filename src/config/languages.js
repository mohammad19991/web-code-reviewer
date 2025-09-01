/**
 * Language-specific configurations
 */

const LANGUAGE_FILE_CONFIGS = {
  js: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    patterns: ['*.js', '*.jsx', '*.ts', '*.tsx', '*.mjs'],
    name: 'JavaScript/TypeScript'
  },
  python: {
    extensions: ['.py', '.pyw', '.pyx', '.pyi'],
    patterns: ['*.py', '.pyw', '.pyx', '.pyi'],
    name: 'Python'
  },
  java: {
    extensions: ['.java'],
    patterns: ['*.java'],
    name: 'Java'
  },
  php: {
    extensions: ['.php'],
    patterns: ['*.php'],
    name: 'PHP'
  }
};

const LANGUAGE_ROLE_CONFIGS = {
  js: {
    role: 'frontend engineer',
    language: 'JavaScript/TypeScript',
    testExample: ' (e.g., RTL/jest/vitest).',
    fileExample: 'src/components/Table.tsx'
  },
  python: {
    role: 'Python engineer',
    language: 'Python',
    testExample: ' (e.g., pytest)',
    fileExample: 'app/services/user_service.py'
  },
  java: {
    role: 'Java engineer',
    language: 'Java',
    testExample: ' (e.g., JUnit + MockMvc)',
    fileExample: 'src/main/java/com/example/user/UserService.java'
  },
  php: {
    role: 'PHP engineer',
    language: 'PHP',
    testExample: ' (e.g., Pest/PHPUnit feature test)',
    fileExample: 'app/Http/Controllers/UserController.php'
  }
};

module.exports = {
  LANGUAGE_FILE_CONFIGS,
  LANGUAGE_ROLE_CONFIGS
};
