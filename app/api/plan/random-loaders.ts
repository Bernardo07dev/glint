import type { PlanStage } from "@prisma/client";

const DEFAULT_PHRASES = [
  "Batendo as asinhas para preparar o próximo passo",
  "Só um instante, estou organizando as ideias",
  "Zumbindo por aqui enquanto preparo tudo",
] as const;

const LOADER_PHRASES: Partial<Record<PlanStage, readonly string[]>> = {
  REFINING_GOAL: [
    "Zumbindo baixinho enquanto entendo onde você quer chegar",
    "Separando o desejo do destino, um favo de cada vez",
    "Lendo sua resposta com meus óculos de foco",
    "Transformando vontade em um objetivo de verdade",
    "Calibrando a bússola da sua jornada",
    "Pousando em cada palavra que você escreveu",
    "Polindo seu objetivo até ele brilhar",
    "Procurando o ponto de chegada mais claro para você",
  ],
  INTERVIEWING_STEPS: [
    "Anotando tudo no meu caderninho de abelha",
    "Conectando essa resposta com o que você já me contou",
    "Entendendo seu jeito de aprender",
    "Escolhendo a próxima pergunta com carinho",
    "Encaixando suas respostas como favos de mel",
    "Voando entre suas respostas para ligar os pontos",
    "Conhecendo você um pouquinho melhor",
    "Guardando esse detalhe para montar seu plano",
  ],
  GENERATING_TASKS: [
    "Montando sua colmeia de sessões, favo por favo",
    "Encaixando cada sessão no seu calendário real",
    "Dividindo o tempo entre assistir e praticar",
    "Desenhando a trilha até o seu objetivo",
    "Organizando as semanas para nada ficar pesado",
  ],
  ENRICHING_TASKS: [
    "Procurando os melhores vídeos para cada sessão",
    "Recortando só o trecho do vídeo que importa",
    "Preparando exercícios práticos sob medida",
    "Coletando néctar de conteúdo de qualidade",
  ],
};

export function getLoaderPhrases(stage: PlanStage): readonly string[] {
  return LOADER_PHRASES[stage] ?? DEFAULT_PHRASES;
}

export function pickNextPhrase(
  phrases: readonly string[],
  currentPhrase?: string,
): string {
  const candidates = phrases.filter((phrase) => phrase !== currentPhrase);
  const pool = candidates.length > 0 ? candidates : phrases;
  return pool[Math.floor(Math.random() * pool.length)];
}
