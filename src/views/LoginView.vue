<script setup lang="ts">
/**
 * Vista de Login.
 * Pantalla donde el usuario introduce sus credenciales. Es DELGADA: recoge los
 * datos, delega en el store de auth (que maneja la lógica de sesión), y reacciona
 * al resultado. No conoce tokens ni HTTP: eso vive en el store y el cliente API.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// Refs reactivos ligados a los campos del formulario.
const username = ref('')
const password = ref('')

// Estado de la interfaz: mensaje de error y si la petición está en curso.
const errorMessage = ref('')
const loading = ref(false)

/**
 * Gestiona el envío del formulario: intenta iniciar sesión y redirige al
 * dashboard si las credenciales son válidas.
 */
async function handleLogin() {
  errorMessage.value = ''
  loading.value = true
  try {
    // Se delega en el store. Si las credenciales fallan, lanza y cae al catch.
    await auth.login(username.value, password.value)
    router.push('/dashboard')
  } catch {
    // Mensaje genérico deliberado: no se revela si el fallo fue por usuario
    // inexistente o contraseña incorrecta, para no facilitar el sondeo de cuentas.
    errorMessage.value = 'Incorrect username or password.'
  } finally {
    // Pase lo que pase, se desactiva el estado de carga.
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <Card class="login-card">
      <template #title>Sign in</template>
      <template #content>
        <!-- Mensaje de error, visible solo cuando hay uno -->
        <Message v-if="errorMessage" severity="error" :closable="false">
          {{ errorMessage }}
        </Message>

        <div class="field">
          <label for="username">Username</label>
          <InputText
            id="username"
            v-model="username"
            placeholder="Your username"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- :feedback="false" oculta el medidor de fuerza de contraseña,
             innecesario en un login (solo aporta valor al registrarse). -->
        <div class="field">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="password"
            :feedback="false"
            toggleMask
            placeholder="Your password"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- :loading muestra un spinner y bloquea el botón mientras se procesa. -->
        <Button
          label="Sign in"
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