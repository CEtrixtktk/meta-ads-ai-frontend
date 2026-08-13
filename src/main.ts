import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// PrimeVue: la librería de componentes y su sistema de temas.
import PrimeVue from 'primevue/config'
//import Aura from '@primeuix/themes/aura'   // 'Aura' es un tema visual moderno de PrimeVue
// por esta (el paquete de v4 que acabas de instalar):
import Aura from '@primevue/themes/aura'

//Import of components PrimeVue
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

// Importamos los componentes de PrimeVue que usaremos en la app.
// Se registran individualmente para incluir en el bundle solo lo necesario.
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import 'primeicons/primeicons.css'   // iconos de PrimeVue
import Panel from 'primevue/panel'

const app = createApp(App)

// Los registramos globalmente con un nombre de etiqueta para usarlos en cualquier vista.
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Button', Button)
app.component('Card', Card)
app.component('Message', Message)
// Segunda etapa de la vista
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Tag', Tag)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Panel', Panel)

app.use(createPinia())
app.use(router)

// Registramos PrimeVue con el tema Aura. Esto habilita todos sus componentes.
app.use(PrimeVue, {
  theme: { preset: Aura },
})

app.mount('#app')
