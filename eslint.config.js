import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['**/dist/**','**/node_modules/**','**/generated/**','**/coverage/**'],files:['**/*.ts','**/*.tsx'],extends:[eslint.configs.recommended,...tseslint.configs.strict],rules:{'@typescript-eslint/no-explicit-any':'error','@typescript-eslint/consistent-type-imports':'error','no-console':'error'}});
