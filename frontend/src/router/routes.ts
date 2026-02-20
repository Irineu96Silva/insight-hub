import type { RouteRecordRaw } from 'vue-router';
import MainLayout from 'layouts/MainLayout.vue';
import AuthLayout from 'layouts/AuthLayout.vue';
import LoginPage from 'pages/LoginPage.vue';
import DashboardPage from 'pages/DashboardPage.vue';
import SystemsPage from 'pages/SystemsPage.vue';
import SystemDetailPage from 'pages/SystemDetailPage.vue';
import EndpointsPage from 'pages/EndpointsPage.vue';
import InsightsPage from 'pages/InsightsPage.vue';
import InsightDetailPage from 'pages/InsightDetailPage.vue';
import ChatInsightPage from 'pages/ChatInsightPage.vue';
import SettingsPage from 'pages/SettingsPage.vue';
import LlmConfigPage from 'pages/LlmConfigPage.vue';
import NetworkTestsPage from 'pages/NetworkTestsPage.vue';
import ErrorNotFound from 'pages/ErrorNotFound.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: DashboardPage },
      { path: 'insights', component: InsightsPage },
      { path: 'insights/:id', component: InsightDetailPage },
      { path: 'network-tests', component: NetworkTestsPage },
      { path: 'chat', component: ChatInsightPage },
      { path: 'systems', component: SystemsPage },
      { path: 'systems/:id', component: SystemDetailPage, props: true },
      { path: 'endpoints', component: EndpointsPage }, // legacy, redirect futura
      { path: 'settings', component: SettingsPage },
      { path: 'settings/llm', component: LlmConfigPage },
    ],
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: LoginPage },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound,
  },
];

export default routes;
