export type DynamicAnimationSceneId =
  | "WAITING_FRONT_TAP"
  | "FIRST_ACCESS"
  | "HOME_SPLASH_READY"
  | "HOME_SPLASH_STREAK"
  | "HOME_SPLASH_RETURN"
  | "HOME_SPLASH_REST"
  | "PLAN_CREATION"
  | "PLANS_HUB";

export type HomeSplashVariant = "READY" | "STREAK" | "RETURN" | "REST";

export type BeeScenePose =
  | "front_waiting"
  | "standard"
  | "focus"
  | "streak"
  | "celebrating"
  | "curious_34"
  | "sleepy";

export interface BaseAnimationProps {
  headline: string;
  isExiting?: boolean;
  className?: string;
}

export interface FlightAnimationProps extends BaseAnimationProps {
  loopFlight?: boolean;
  onComplete?: () => void;
}

export interface DynamicScenePreset {
  id: DynamicAnimationSceneId;
  sectionLabel: string;
  variantLabel: string;
  pose: BeeScenePose;
  headline: string;
  subtitle: string;
  contextTag: string;
  bgBase: string;
  haloPrimary: string;
  haloSecondary: string;
  ribbonPrimary: string;
  ribbonSecondary: string;
  accentColor: string;
}

export const DYNAMIC_SCENE_PRESETS: Record<
  DynamicAnimationSceneId,
  DynamicScenePreset
> = {
  WAITING_FRONT_TAP: {
    id: "WAITING_FRONT_TAP",
    sectionLabel: "Carregando Plano · WAITING_FRONT_TAP",
    variantLabel: "Plano Carregando (Polling + Voltar)",
    pose: "front_waiting",
    headline:
      "Calma aí, Bernardo... tô montando seu plano direitinho. Se quiser voltar, eu te aviso assim que ficar pronto!",
    subtitle: "Acompanhando a criação em tempo real.",
    contextTag: "Plan Loading · Polling",
    bgBase: "#FFFDF8",
    haloPrimary: "#FFE07D",
    haloSecondary: "#FFF0E5",
    ribbonPrimary: "#5B8DEF",
    ribbonSecondary: "#FF9B85",
    accentColor: "#95E1B0",
  },
  FIRST_ACCESS: {
    id: "FIRST_ACCESS",
    sectionLabel: "Cena 1 · FIRST_ACCESS",
    variantLabel: "Primeira Vez no Glint",
    pose: "celebrating",
    headline: "Bem vindooo, Bernardo! Que bom te ter aqui.",
    subtitle: "Desenhando uma jornada que cabe na sua semana real.",
    contextTag: "Primeiro acesso · 0ms pre-computed",
    bgBase: "#FFFDF8",
    haloPrimary: "#FFE07D",
    haloSecondary: "#FFF0E5",
    ribbonPrimary: "#5B8DEF",
    ribbonSecondary: "#FF9B85",
    accentColor: "#95E1B0",
  },
  HOME_SPLASH_READY: {
    id: "HOME_SPLASH_READY",
    sectionLabel: "Cena 2A · HOME_SPLASH",
    variantLabel: "Sessão do Dia Pronta",
    pose: "focus",
    headline:
      "Bernardo, seus 25 minutos de Arquitetura Distribuída já estão prontos para hoje.",
    subtitle: "Terça · 19h30 · Filas assíncronas e mensageria na prática.",
    contextTag: "Task READY · Terça 19:30",
    bgBase: "#FFFDF8",
    haloPrimary: "#E8F0FE",
    haloSecondary: "#FFF0E5",
    ribbonPrimary: "#5B8DEF",
    ribbonSecondary: "#FF9B85",
    accentColor: "#FFE07D",
  },
  HOME_SPLASH_STREAK: {
    id: "HOME_SPLASH_STREAK",
    sectionLabel: "Cena 2B · HOME_SPLASH",
    variantLabel: "Ritmo Forte & Streak",
    pose: "streak",
    headline:
      "Quarta sessão concluída nesta semana, Bernardo. Seu ritmo em Rust está impecável!",
    subtitle: "4 de 4 sessões semanais cumpridas no horário planejado.",
    contextTag: "Streak 4 dias · Pose 3 Voo Rápido",
    bgBase: "#FFFDF8",
    haloPrimary: "#FFE07D",
    haloSecondary: "#95E1B0",
    ribbonPrimary: "#FF9B85",
    ribbonSecondary: "#5B8DEF",
    accentColor: "#95E1B0",
  },
  HOME_SPLASH_RETURN: {
    id: "HOME_SPLASH_RETURN",
    sectionLabel: "Cena 2C · HOME_SPLASH",
    variantLabel: "Retorno Acolhedor (Sem Culpa)",
    pose: "curious_34",
    headline:
      "Que bom te ver de volta, Bernardo. Reorganizei sua trilha para retomarmos sem pressa.",
    subtitle: "Nenhuma aula foi perdida: ajustamos tudo aos seus dias livres.",
    contextTag: "Retorno após 6 dias · Pose 5 Olhar 3/4",
    bgBase: "#FFFDF8",
    haloPrimary: "#E8F0FE",
    haloSecondary: "#F3EFE6",
    ribbonPrimary: "#5B8DEF",
    ribbonSecondary: "#FF9B85",
    accentColor: "#FFE07D",
  },
  HOME_SPLASH_REST: {
    id: "HOME_SPLASH_REST",
    sectionLabel: "Cena 2D · HOME_SPLASH",
    variantLabel: "Dia Concluído & Descanso",
    pose: "sleepy",
    headline:
      "Missão de hoje cumprida, Bernardo. Hora de fechar o caderno e descansar até quinta.",
    subtitle: "Próxima sessão: Quinta às 19h30 · Consistência Eventual.",
    contextTag: "Horário livre · Pose 6 Sonolenta (zZ)",
    bgBase: "#FFFDF8",
    haloPrimary: "#F3EFE6",
    haloSecondary: "#E8F0FE",
    ribbonPrimary: "#5B8DEF",
    ribbonSecondary: "#FF9B85",
    accentColor: "#FFE07D",
  },
  PLAN_CREATION: {
    id: "PLAN_CREATION",
    sectionLabel: "Cena 3 · PLAN_CREATION",
    variantLabel: "Construção do Plano & Colmeia",
    pose: "standard",
    headline:
      "Encaixando suas 4 horas semanais à noite para você dominar Next.js 16 sem atropelar a rotina...",
    subtitle: "Conectando terça, quinta e sábado de manhã com prática guiada.",
    contextTag: "GENERATING_TASKS · Contexto real do aluno",
    bgBase: "#FFFDF8",
    haloPrimary: "#FFE07D",
    haloSecondary: "#FFF0E5",
    ribbonPrimary: "#5B8DEF",
    ribbonSecondary: "#FF9B85",
    accentColor: "#95E1B0",
  },
  PLANS_HUB: {
    id: "PLANS_HUB",
    sectionLabel: "Cena 5 · PLANS_HUB",
    variantLabel: "Trilha & Rota Recalculada (Replan)",
    pose: "celebrating",
    headline:
      "Rota recalculada sem estresse: movi suas sessões de quarta para sábado e mantive sua meta intacta.",
    subtitle: "Semana 3 de 6 · 8 sessões concluídas com progresso salvo.",
    contextTag: "Pós-Replan · Pose 4 Comemorando",
    bgBase: "#FFFDF8",
    haloPrimary: "#95E1B0",
    haloSecondary: "#FFE07D",
    ribbonPrimary: "#5B8DEF",
    ribbonSecondary: "#95E1B0",
    accentColor: "#FF9B85",
  },
};
