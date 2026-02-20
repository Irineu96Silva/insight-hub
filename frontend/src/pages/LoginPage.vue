<template>
  <q-page class="login-page">
    <div class="login-split">
      <!-- LEFT: Brand Hero -->
      <div class="login-hero">
        <div class="hero-bg">
          <div class="grid-overlay" />
          <div class="glow-orb glow-orb--1" />
          <div class="glow-orb glow-orb--2" />
        </div>

        <div class="hero-content">
          <div class="hero-logo">
            <div class="logo-icon">
              <q-icon
                name="hub"
                size="56px"
              />
            </div>
            <h1 class="logo-text">
              INSIGHT<span class="logo-accent">HUB</span>
            </h1>
            <p class="logo-tagline">
              Sistema de Integração &amp; Análise Inteligente
            </p>
          </div>

          <div class="hero-features">
            <div class="feature-item">
              <q-icon
                name="auto_awesome"
                size="20px"
                color="cyan"
              />
              <span>Insights gerados por IA em tempo real</span>
            </div>
            <div class="feature-item">
              <q-icon
                name="api"
                size="20px"
                color="purple-4"
              />
              <span>Monitoramento inteligente de APIs</span>
            </div>
            <div class="feature-item">
              <q-icon
                name="analytics"
                size="20px"
                color="pink-4"
              />
              <span>Dashboard com métricas e alertas</span>
            </div>
          </div>

          <div class="hero-footer">
            <span>© 2026 InsightHub — Todos os direitos reservados</span>
          </div>
        </div>
      </div>

      <!-- RIGHT: Login Form -->
      <div class="login-form-side">
        <div class="form-container">
          <div class="form-header">
            <h2 class="form-title">
              Bem-vindo de volta
            </h2>
            <p class="form-subtitle">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          <q-form
            class="login-form"
            @submit="onSubmit"
          >
            <div class="field-group">
              <label class="field-label">Email</label>
              <q-input
                v-model="email"
                type="email"
                placeholder="seu@email.com"
                dense
                outlined
                dark
                color="cyan"
                class="login-input"
                :rules="[val => !!val || 'Email obrigatório']"
              >
                <template #prepend>
                  <q-icon
                    name="mail"
                    color="grey-6"
                  />
                </template>
              </q-input>
            </div>

            <div class="field-group">
              <label class="field-label">Senha</label>
              <q-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Digite sua senha"
                dense
                outlined
                dark
                color="cyan"
                class="login-input"
                :rules="[val => !!val || 'Senha obrigatória']"
              >
                <template #prepend>
                  <q-icon
                    name="lock"
                    color="grey-6"
                  />
                </template>
                <template #append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    color="grey-6"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>

            <div class="form-options">
              <q-checkbox
                v-model="rememberMe"
                label="Lembrar-me"
                dense
                color="cyan"
                dark
                class="remember-cb"
              />
              <a
                href="#"
                class="forgot-link"
              >Esqueceu a senha?</a>
            </div>

            <q-btn
              type="submit"
              class="submit-btn"
              :loading="loading"
              unelevated
              no-caps
            >
              <q-icon
                name="login"
                class="q-mr-sm"
              />
              Entrar no Sistema
            </q-btn>
          </q-form>

          <div class="form-footer">
            <div class="security-badge">
              <q-icon
                name="verified_user"
                size="14px"
              />
              <span>Conexão segura e criptografada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth.store';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const authStore = useAuthStore();
const $q = useQuasar();
const router = useRouter();

async function onSubmit() {
  loading.value = true;
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push('/');
    $q.notify({
      type: 'positive',
      message: 'Login realizado com sucesso!',
      icon: 'check_circle'
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Credenciais inválidas',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  padding: 0 !important;
}

.login-split {
  display: flex;
  min-height: 100vh;
}

// =========================================
// LEFT HERO
// =========================================
.login-hero {
  flex: 1;
  background: #030308;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: grid-drift 25s linear infinite;
}

@keyframes grid-drift {
  0% { transform: translateY(0); }
  100% { transform: translateY(50px); }
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;

  &--1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 245, 255, 0.5) 0%, transparent 70%);
    top: -15%;
    left: -10%;
    animation: orb1 10s ease-in-out infinite;
  }

  &--2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%);
    bottom: -10%;
    right: -5%;
    animation: orb2 12s ease-in-out infinite;
  }
}

@keyframes orb1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 20px) scale(1.1); }
}
@keyframes orb2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-20px, -30px) scale(1.05); }
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 48px;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
}

.hero-logo {
  margin-bottom: 64px;
}

.logo-icon {
  width: 88px;
  height: 88px;
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
  border: 2px solid rgba(0, 245, 255, 0.25);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00f5ff;
  margin-bottom: 24px;
  box-shadow: 0 0 50px rgba(0, 245, 255, 0.15);
}

.logo-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: 4px;
  color: #f1f5f9;
  margin: 0;
  line-height: 1;
}

.logo-accent {
  background: linear-gradient(90deg, #00f5ff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-tagline {
  font-size: 1rem;
  color: #64748b;
  margin-top: 12px;
  letter-spacing: 1px;
}

.hero-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.95rem;
  color: #94a3b8;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 245, 255, 0.05);
    border-color: rgba(0, 245, 255, 0.15);
  }
}

.hero-footer {
  margin-top: auto;
  padding-top: 48px;
  font-size: 0.75rem;
  color: #475569;
}

// =========================================
// RIGHT FORM
// =========================================
.login-form-side {
  width: 520px;
  min-width: 0;
  background: #0a0a14;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.form-container {
  width: 100%;
  max-width: 380px;
  padding: 48px 40px;
}

.form-header {
  margin-bottom: 40px;
}

.form-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

.form-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.login-input {
  :deep(.q-field__control) {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
  }

  :deep(.q-field__native) {
    color: #f1f5f9;

    &::placeholder {
      color: #475569;
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-cb {
  :deep(.q-checkbox__label) {
    font-size: 0.8rem;
    color: #94a3b8;
  }
}

.forgot-link {
  font-size: 0.8rem;
  color: #00f5ff;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #a855f7;
  }
}

.submit-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #00f5ff 0%, #3b82f6 50%, #a855f7 100%) !important;
  border-radius: 12px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: #030308;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 245, 255, 0.35);
  }
}

.form-footer {
  margin-top: 32px;
  text-align: center;
}

.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.15);
  padding: 6px 16px;
  border-radius: 20px;
}

// =========================================
// RESPONSIVE
// =========================================
@media (max-width: 900px) {
  .login-split {
    flex-direction: column;
  }

  .login-hero {
    min-height: 220px;
  }

  .hero-content {
    padding: 24px 20px;
  }

  .hero-features {
    display: none;
  }

  .hero-footer {
    display: none;
  }

  .login-form-side {
    width: 100%;
    min-width: unset;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .form-container {
    padding: 32px 24px;
    max-width: 100%;
  }
}

@media (max-width: 599px) {
  .login-hero {
    min-height: 180px;
  }

  .hero-content {
    padding: 20px 16px;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;

    .q-icon {
      font-size: 36px !important;
    }
  }

  .logo-text {
    font-size: 1.8rem;
    letter-spacing: 2px;
  }

  .logo-tagline {
    font-size: 0.8rem;
  }

  .hero-logo {
    margin-bottom: 0;
  }

  .form-container {
    padding: 24px 16px;
  }

  .form-title {
    font-size: 1.3rem;
  }

  .form-header {
    margin-bottom: 24px;
  }

  .login-form {
    gap: 16px;
  }

  .submit-btn {
    height: 46px;
    font-size: 0.8rem;
  }

  .form-options {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
