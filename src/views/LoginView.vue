<script setup lang="ts">
/**
 * Vista de Login.
 * Pantalla donde el usuario introduce sus credenciales. Es DELGADA: recoge los
 * datos, llama al store de auth (que maneja la lógica), y reacciona al resultado.
 * No sabe de tokens ni de HTTP: eso vive en el store y el cliente API.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// Refs reactivos ligados a los campos del formulario.
const username = ref('')
const password = ref('')

// Estado de la UI: mensaje de error y si estamos procesando (para el botón).
const errorMessage = ref('')
const loading = ref(false)

/**
 * Maneja el envío del formulario: intenta login y redirige al dashboard si va bien.
 */
async function handleLogin() {
  errorMessage.value = ''
  loading.value = true
  try {
    // Delegamos en el store. Si las credenciales fallan, lanza y caemos al catch.
    await auth.login(username.value, password.value)
    // Éxito: navegamos al dashboard.
    router.push('/dashboard')
  } catch {
    // Mensaje genérico y amable; el detalle real no se expone al usuario.
    errorMessage.value = 'Usuario o contraseña incorrectos.'
  } finally {
    // Pase lo que pase, dejamos de mostrar el estado "cargando".
    loading.value = false
  }
}
</script>

<template>
  <!-- Contenedor centrado en la pantalla -->
  <div class="login-container">
    <Card class="login-card">
      <template #title>Iniciar sesión</template>
      <template #content>
        <!-- Mensaje de error, solo visible si hay uno -->
        <Message v-if="errorMessage" severity="error" :closable="false">
          {{ errorMessage }}
        </Message>

        <!-- Campo de usuario -->
        <div class="field">
          <label for="username">Usuario</label>
          <InputText
            id="username"
            v-model="username"
            placeholder="Tu usuario"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Campo de contraseña. :feedback="false" oculta el medidor de fuerza,
             innecesario en un login (solo útil al registrarse). -->
        <div class="field">
          <label for="password">Contraseña</label>
          <Password
            id="password"
            v-model="password"
            :feedback="false"
            toggleMask
            placeholder="Tu contraseña"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Botón de envío. :loading muestra un spinner mientras procesa. -->
        <Button
          label="Entrar"
          :loading="loading"
          @click="handleLogin"
          class="login-button"
        />
      </template>
    </Card>
  </div>
</template>

<style scoped>
/* 'scoped' limita estos estilos a este componente: no afectan al resto de la app. */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.login-card {
  width: 100%;
  max-width: 400px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.login-button {
  width: 100%;
}
</style>