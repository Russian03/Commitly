/** Líneas que atribuyen el cambio a coautores o a herramientas de generación. */
const ATTRIBUTION =
  /^\W*(?:(?:co-authored-by|assisted-by|generated-by)\s*:|generated (?:with|by)\s)/im

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  // También se revisan los commits de merge, revert y fixup.
  defaultIgnores: false,
  plugins: [
    {
      rules: {
        'no-attribution': ({ raw }) => [
          !ATTRIBUTION.test(raw ?? ''),
          'el mensaje no puede llevar coautores ni líneas de atribución',
        ],
      },
    },
  ],
  rules: {
    'no-attribution': [2, 'always'],
    // Los asuntos van en español y pueden llevar nombres propios.
    'subject-case': [0],
    // La descripción de un PR acaba en el commit y no tiene el ancho limitado.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
}
