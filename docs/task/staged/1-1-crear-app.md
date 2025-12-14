# Crear github action

## Objetivo

Crear Github Action, que a traves de los archivos de dependencias (packages.json, etc...) y las funciones de GitHub mire que lenguajes y librerías se estan utlizando en el repositorio donde se aplique. Comparar-lo con la lista de la API de `https://kind-creation-production.up.railway.app/pre-tech?q=` descrita en `https://kind-creation-production.up.railway.app/api`.

- El hecho de comprobar en ese endpoint, es porque ese endpoint devuelve las techs que tienen logo oficial disponible en 'Simple Icons'. La libreria de React.

## Definition Action

### Input:

#### `full` (boolean, default: false)

- Si se activa, pondra todas las librerias y lenguajes que detecte como 'Topic'
- Si no se activa (por defecto), pondrá solo las librerias y lenguajes que detecte disponibles en las listas de `https://kind-creation-production.up.railway.app/pre-tech`

#### `exclude` (string - coma separated or space separated - nameId based, optional) - **FUTURO**

- Excluye las 'techs' incluidas, por mucho que esten en la lista.

## Ejemplo respuesta API

{"success":true,"type":"ENTITIES*FOUND","data":[{"\_id":"6781a154e3b4e01935bb2105","nameId":"American Express","nameBadge":"americanexpress","color":"2E77BC","web":"https://commons.wikimedia.org/wiki/File:American_Express_logo*(2018).svg","**v":0,"createdAt":"2025-01-10T22:38:12.528Z","updatedAt":"2025-01-10T22:38:12.528Z"},{"\_id":"6781a154e3b4e01935bb23e4","nameId":"ERPNext","nameBadge":"erpnext","color":"0089FF","web":"https://github.com/frappe/erpnext/blob/924911e74317f95a59f29e9410d4f141020a0411/erpnext/public/images/erpnext-logo.svg","**v":0,"createdAt":"2025-01-10T22:38:12.541Z","updatedAt":"2025-01-10T22:38:12.541Z"},{"\_id":"6781a154e3b4e01935bb2597","nameId":"i18next","nameBadge":"i18next","color":"26A69A","web":"https://github.com/i18next/i18next-gitbook/blob/32efcfd9c59ae55cc63a60e633dbc1651c7950ad/assets/img/logo.svg","__v":0,"createdAt":"2025-01-10T22:38:12.889Z","updatedAt":"2025-01-10T22:38:12.889Z"},{"_id":"6781a154e3b4e01935bb265a","nameId":"Knex.js","nameBadge":"knexdotjs","color":"D26B38","web":"https://github.com/knex/documentation/blob/a9c4ce47dbc6001bb1c6aa0649bb668edc78fea7/src/public/knex-logo.png","__v":0,"createdAt":"2025-01-10T22:38:12.892Z","updatedAt":"2025-01-10T22:38:12.892Z"},{"_id":"6781a154e3b4e01935bb27cd","nameId":"Nexon","nameBadge":"nexon","color":"000000","web":"https://www.nexon.com","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27ce","nameId":"Next.js","nameBadge":"nextdotjs","color":"000000","web":"https://vercel.com/design/brands#next-js","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27cf","nameId":"NextBillion.ai","nameBadge":"nextbilliondotai","color":"8D5A9E","web":"https://nextbillion.ai","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27d1","nameId":"NextDNS","nameBadge":"nextdns","color":"007BFF","web":"https://github.com/simple-icons/simple-icons/pull/9150#issuecomment-1856317201","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27d0","nameId":"Nextcloud","nameBadge":"nextcloud","color":"0082C9","web":"https://nextcloud.com/press/","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27d2","nameId":"Nextdoor","nameBadge":"nextdoor","color":"8ED500","web":"https://about.nextdoor.com/us-media/","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27d3","nameId":"Nextflow","nameBadge":"nextflow","color":"0DC09D","web":"https://github.com/seqeralabs/logos/blob/a8d4906b8fa7359541e520882f93a4bf029af44c/nextflow/nextflow_icon_color.svg","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27d4","nameId":"Nextra","nameBadge":"nextra","color":"000000","web":"https://nextra.site","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27d5","nameId":"NextUI","nameBadge":"nextui","color":"000000","web":"https://nextui.org/figma","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6781a154e3b4e01935bb27d6","nameId":"Nexus Mods","nameBadge":"nexusmods","color":"E6832B","web":"https://wiki.nexusmods.com/skins/Metrolook/images/nexuslogo.svg","__v":0,"createdAt":"2025-01-10T22:38:12.897Z","updatedAt":"2025-01-10T22:38:12.897Z"},{"_id":"6830a535d2f1230a2519b129","nameId":"NEXON","nameBadge":"nexon","color":"000000","web":"https://brand.nexon.com/en/ci-brand-guidelines/primary-identity","__v":0,"createdAt":"2025-05-23T16:41:25.604Z","updatedAt":"2025-05-23T16:41:25.604Z"}],"timestamp":1765733249891}

## Key points

- [ ] La app compara el nombre de las dependencias utilizadas (a traves de las funciones de detección de Github, y un escaneo de los archivos de dependencias del proyecto) y lo busca en la API
  - Compara variantes tipicas, por ejemplo NextJS, puede ser que se encuentre en la lista con el nameId: Next.js, etc...
  - [ ] Has las siguientes transformaciones siempre
  - nameId: `.` -> GitHub: `-`
  - [ ] Ha de tener soporte para los archivos de dependencias de los siguientes lenguajes como mínimo, con todos los ppales empaquetadores disponibles (npm, bun, etc..): Python, JavaScript, Go, C, C++, Rust, Html, Css, Php
- [ ] Con esto, modifica y crea los `Topics` en el repositorio de Github donde se cargue la Github Action
  - De forma que si el usuario utiliza la action, y en el repositorio tiene un servicio de Go con Fiber y otro de Ts, con Nextjs y Shadcnui. Consultara en la api cuales estan disponibles, y los que esten disponibles creara un 'Topic' en el repositorio para cada uno de ellos.
- [ ] 'full' input: se incluyen todas las 'techs' detectadas, tanto por github como por dependencias. Por defecto va desactivado y solo se incluyen las disponibles en el endpoint.
  - (En este ejemplo, Fiber no esta disponible por lo que no se incluira en la lista por mucho que se detecte. SOLO EN CASO DE QUE EL USUARIO ACTIVE 'full' INPUT, ENTONCES SI QUE SE GUARDARIA)

- [ ] La action solo se re-ejecuta si se detectan cambios en el archivo de dependencias o si el repositorio no tiene topics aun(primera vez)
