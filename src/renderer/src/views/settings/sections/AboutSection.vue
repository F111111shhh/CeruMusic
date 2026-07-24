<script setup lang="ts">
import { ref } from 'vue'
import Versions from '@renderer/components/Versions.vue'

const appVersion = ref('未知')

const getAppVersion = async () => {
  try {
    const version = await window.electron.ipcRenderer.invoke('get-app-version')
    if (version) appVersion.value = version
  } catch (error) {
    console.warn('Failed to get app version via IPC:', error)
  }
}

void getAppVersion()
</script>

<template>
  <div class="settings-section">
    <section class="setting-group app-header" aria-labelledby="about-app-title">
      <div class="app-logo">
        <img src="/logo.svg" alt="Ceru Music" />
      </div>
      <div class="app-info">
        <div class="app-title-row">
          <h2 id="about-app-title">Cerulean Music</h2>
          <span class="app-version">v{{ appVersion }}</span>
        </div>
        <p class="app-subtitle">澜音播放器</p>
        <p class="app-description">
          一款跨平台音乐播放器，支持本地媒体以及用户自行配置的音乐来源。
        </p>
      </div>
    </section>

    <section id="about-version" class="setting-group" aria-labelledby="about-version-title">
      <h3 id="about-version-title">版本信息</h3>
      <Versions />
    </section>

    <section id="about-legal" class="setting-group" aria-labelledby="about-legal-title">
      <h3 id="about-legal-title">法律声明</h3>
      <div class="legal-notice">
        <article class="notice-item">
          <h4>软件定位</h4>
          <p>
            本软件是媒体播放与扩展运行工具，不销售、授权或运营音乐内容服务。第三方平台名称、商标、封面、歌词及作品信息均归相应权利人所有，在软件中出现仅用于识别来源。
          </p>
        </article>
        <article class="notice-item">
          <h4>内容与授权</h4>
          <p>
            用户应确保对访问、播放、缓存、下载、转换或分享的内容拥有合法授权，并遵守所在地法律及内容提供方的服务条款。请勿利用本软件规避付费、访问控制、数字版权管理或其他技术保护措施。
          </p>
        </article>
        <article class="notice-item">
          <h4>插件与第三方服务</h4>
          <p>
            用户安装的插件、脚本和自行配置的接口由其各自提供者负责。使用前应审查来源、权限与隐私政策。第三方接口可能随时变更、限流或停止服务，本软件不保证其持续可用或返回内容的准确性。
          </p>
        </article>
        <article class="notice-item">
          <h4>隐私与凭据</h4>
          <p>
            请勿向不可信插件提供账号、Cookie、访问令牌或其他敏感信息。因第三方插件、接口或用户配置造成的数据泄露、账号限制及其他损失，应由相应责任方依法承担。
          </p>
        </article>
        <article class="notice-item">
          <h4>开源许可与免责声明</h4>
          <p>
            本软件代码依 GNU AGPL v3.0
            许可提供。复制、修改、分发或通过网络提供修改版时，应履行该许可证规定的源码提供与版权声明义务。在法律允许的最大范围内，本软件按现状提供，不对特定用途适用性、第三方服务可用性或间接损失作保证。
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  animation: fade-in-up 0.35s ease-out;
}

.setting-group {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--settings-group-border);
  border-radius: 8px;
  background: var(--settings-group-bg);
  box-shadow: 0 1px 3px var(--settings-group-shadow);

  h3 {
    margin: 0 0 1rem;
    color: var(--settings-text-primary);
    font-size: 1.125rem;
    font-weight: 600;
  }
}

.app-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.app-logo {
  width: 4rem;
  height: 4rem;
  flex: 0 0 4rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.app-info {
  min-width: 0;
}

.app-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.25rem;

  h2 {
    margin: 0;
    color: var(--settings-text-primary);
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.app-version {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--td-brand-color-3);
  border-radius: 8px;
  background: var(--td-brand-color-1);
  color: var(--td-brand-color-6);
  font-size: 0.75rem;
  font-weight: 600;
}

.app-subtitle {
  margin: 0 0 0.5rem;
  color: var(--td-brand-color-5);
  font-size: 1rem;
  font-weight: 600;
}

.app-description {
  margin: 0;
  color: var(--settings-text-secondary);
  line-height: 1.6;
}

.legal-notice {
  display: grid;
  gap: 0;
}

.notice-item {
  padding: 1rem 0;
  border-bottom: 1px solid var(--settings-group-border);

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  h4 {
    margin: 0 0 0.5rem;
    color: var(--settings-text-primary);
    font-size: 0.9375rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--settings-text-secondary);
    font-size: 0.875rem;
    line-height: 1.75;
  }
}

@media (max-width: 640px) {
  .app-header {
    align-items: flex-start;
    gap: 1rem;
  }

  .app-logo {
    width: 3.25rem;
    height: 3.25rem;
    flex-basis: 3.25rem;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
