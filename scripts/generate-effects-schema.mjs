// One-time transcription helper: TypeScript contract declarations -> Zod shape.
import fs from 'node:fs'
import ts from 'typescript'
const contract = fs.readFileSync('docs/CONTRATO.md', 'utf8')
const section = contract.slice(contract.indexOf('### FEAT-11 —'))
const source = section.slice(section.indexOf('interface Effect {'), section.indexOf('// ---------- Cartas'))
const ast = ts.createSourceFile('effects.ts', source, ts.ScriptTarget.Latest, true)
const declarations = new Map(ast.statements.filter(s => ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)).map(s => [s.name.text, s]))
const schemaName = name => name[0].toLowerCase() + name.slice(1) + 'Schema'
const external = new Set()
const emitted = new Set()
const output = []
function reference(name) {
  if (declarations.has(name)) emit(name)
  else external.add(name)
  return schemaName(name)
}
function object(members) {
  return `z.object({\n${members.map(m => `${m.name.getText(ast)}: ${convert(m.type)}${m.questionToken ? '.optional()' : ''}`).join(',\n')}\n})`
}
function convert(t) {
  if (t.kind === ts.SyntaxKind.StringKeyword) return 'z.string()'
  if (t.kind === ts.SyntaxKind.NumberKeyword) return 'z.number()'
  if (t.kind === ts.SyntaxKind.BooleanKeyword) return 'z.boolean()'
  if (ts.isParenthesizedTypeNode(t)) return convert(t.type)
  if (ts.isLiteralTypeNode(t)) return t.literal.kind === ts.SyntaxKind.NullKeyword ? 'z.null()' : `z.literal(${t.literal.getText(ast)})`
  if (ts.isTypeLiteralNode(t)) return object(t.members)
  if (ts.isArrayTypeNode(t)) return `z.array(${convert(t.elementType)})`
  if (ts.isUnionTypeNode(t)) {
    if (t.types.every(x => ts.isLiteralTypeNode(x) && ts.isStringLiteral(x.literal))) return `z.enum([${t.types.map(x => x.literal.getText(ast)).join(',')}])`
    return `z.union([${t.types.map(convert).join(',\n')}])`
  }
  if (ts.isIntersectionTypeNode(t)) return `${convert(t.types[0])}.extend(${convert(t.types[1])}.shape)`
  if (ts.isTypeReferenceNode(t)) {
    if (t.typeName.getText(ast) === 'Omit') return `${reference(t.typeArguments[0].getText(ast))}.omit({${t.typeArguments[1].literal.text}: true})`
    return reference(t.typeName.getText(ast))
  }
  throw new Error(t.getText(ast))
}
function emit(name) {
  if (emitted.has(name)) return
  emitted.add(name)
  const declaration = declarations.get(name)
  let schema = ts.isInterfaceDeclaration(declaration) ? object(declaration.members) : convert(declaration.type)
  if (['Trigger','Cost','Activation','Duration'].includes(name)) schema = schema.replace('z.union(', "z.discriminatedUnion('kind', ")
  output.push(`export const ${schemaName(name)} = ${schema}\nexport type ${name} = z.infer<typeof ${schemaName(name)}>\n`)
}
for (const name of declarations.keys()) emit(name)
fs.writeFileSync('src/api/effects.ts', `import { z } from 'zod'\nimport { ${[...external].map(schemaName).join(', ')} } from './vocabulary'\n\n/** CONTRATO v0.52 §3 FEAT-11: only shapes; cross-field game rules belong to the backend. */\n${output.join('\n')}`)
const catalog = fs.readFileSync('src/api/catalog.ts','utf8')
const start = catalog.indexOf('export const cardTypeSchema')
const end = catalog.indexOf('/** Texto de regra')
const vocabulary = catalog.slice(start,end)
fs.writeFileSync('src/api/vocabulary.ts', `import { z } from 'zod'\n\n${vocabulary}`)
const names = [...vocabulary.matchAll(/export (?:const|type) (\w+)/g)].map(x=>x[1])
const imports = names.filter(name=>new RegExp(`\\b${name}\\b`).test(catalog.slice(end)))
fs.writeFileSync('src/api/catalog.ts', catalog.slice(0,start) + `export * from './vocabulary'\nimport { ${imports.map(n=>n.endsWith('Schema')?n:'type '+n).join(', ')} } from './vocabulary'\nimport { effectSchema, zoneEffectSchema } from './effects'\n\n` + catalog.slice(end).replace(/effects: z.array\(\s*ruleTextSchema.extend\(\{ polarity: z.enum\(\['positive', 'negative'\]\) \}\),\s*\)/, 'effects: z.array(zoneEffectSchema)').replaceAll('effects: z.array(ruleTextSchema)', 'effects: z.array(effectSchema)').replace(/(export const dimensionCardSchema = [\s\S]*?)effects: z.array\(effectSchema\)/, '$1effects: z.array(zoneEffectSchema)'))
