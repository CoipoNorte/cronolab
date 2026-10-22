/* ============================================================
   MOTOR NARRATIVO — diálogos ramificados como datos.

   El motor no conoce React, canvas ni botones. Solo sabe:
   - en qué nodo está
   - qué variables existen
   - qué elecciones cumplen sus condiciones
   - qué efectos aplica cada elección

   Esa separación permite escribir el diálogo en un editor,
   guardarlo como JSON y ejecutarlo en navegador, Unity o Godot.
   ============================================================ */

export type Value = string | number | boolean;
export type CompareOp = "==" | "!=" | ">=" | "<=" | ">" | "<";
export type EffectOp = "set" | "add" | "toggle";

export interface Condition {
  key: string;
  op: CompareOp;
  value: Value;
}

export interface Effect {
  key: string;
  op: EffectOp;
  value: Value;
}

export interface Choice {
  id: string;
  label: string;
  target: string | null;
  condition?: Condition;
  effects: Effect[];
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: Choice[];
  event?: string;
}

export interface DialogueProject {
  title: string;
  start: string;
  variables: Record<string, Value>;
  nodes: DialogueNode[];
}

export interface Runtime {
  nodeId: string | null;
  variables: Record<string, Value>;
  history: string[];
  events: string[];
  ended: boolean;
}

export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
  nodeId?: string;
}

const choice = (
  id: string,
  label: string,
  target: string | null,
  effects: Effect[] = [],
  condition?: Condition,
): Choice => ({ id, label, target, effects, condition });

export const DEFAULT_DIALOGUE: DialogueProject = {
  title: "La guardiana del portal",
  start: "inicio",
  variables: {
    confianza: 0,
    cristales: 0,
    monedas: 3,
    tieneLlave: false,
    mision: "sin_empezar",
  },
  nodes: [
    {
      id: "inicio",
      speaker: "MIRA · GUARDIANA",
      text: "El portal perdió su luz. Necesito tres cristales verdes antes de que caiga la noche. ¿Me ayudarás?",
      event: "dialogo_iniciado",
      choices: [
        choice("aceptar", "Cuenta conmigo.", "encargo", [
          { key: "confianza", op: "add", value: 1 },
          { key: "mision", op: "set", value: "activa" },
        ]),
        choice("preguntar", "¿Qué gano yo?", "recompensa", [
          { key: "confianza", op: "add", value: -1 },
        ]),
        choice("presumir", "Ya tengo los tres cristales.", "entrega", [], {
          key: "cristales", op: ">=", value: 3,
        }),
      ],
    },
    {
      id: "recompensa",
      speaker: "MIRA · GUARDIANA",
      text: "Una pregunta razonable. Puedo ofrecerte la llave de las ruinas y veinte monedas. La reliquia que encuentres será tuya.",
      choices: [
        choice("trato", "Trato hecho.", "encargo", [
          { key: "mision", op: "set", value: "activa" },
        ]),
        choice("soborno", "Primero quiero un adelanto.", "adelanto", [], {
          key: "confianza", op: ">=", value: 1,
        }),
        choice("rechazar", "No me interesa.", "rechazo", [
          { key: "mision", op: "set", value: "rechazada" },
        ]),
      ],
    },
    {
      id: "adelanto",
      speaker: "MIRA · GUARDIANA",
      text: "Confío en ti. Toma cinco monedas, pero no me hagas arrepentirme.",
      event: "adelanto_entregado",
      choices: [
        choice("guardar", "Guardar las monedas.", "encargo", [
          { key: "monedas", op: "add", value: 5 },
          { key: "mision", op: "set", value: "activa" },
        ]),
      ],
    },
    {
      id: "encargo",
      speaker: "MIRA · GUARDIANA",
      text: "Busca junto al lago, en el bosque del sur y cerca del sendero oriental. Vuelve cuando el contador marque tres.",
      event: "mision_aceptada",
      choices: [
        choice("salir", "Iré a buscarlos.", null),
        choice("entregar", "Ya están aquí.", "entrega", [], {
          key: "cristales", op: ">=", value: 3,
        }),
      ],
    },
    {
      id: "entrega",
      speaker: "MIRA · GUARDIANA",
      text: "Los cristales responden a tu presencia. Has cumplido tu parte; yo cumpliré la mía.",
      event: "cristales_entregados",
      choices: [
        choice("llave", "Recibir la llave del portal.", "portal", [
          { key: "tieneLlave", op: "set", value: true },
          { key: "mision", op: "set", value: "completa" },
          { key: "monedas", op: "add", value: 20 },
        ]),
      ],
    },
    {
      id: "portal",
      speaker: "PORTAL DEL RELOJ",
      text: "La llave vibra. La piedra recuerda tu nombre y la puerta comienza a abrirse.",
      event: "portal_abierto",
      choices: [
        choice("entrar", "Entrar en las ruinas.", null, [], {
          key: "tieneLlave", op: "==", value: true,
        }),
      ],
    },
    {
      id: "rechazo",
      speaker: "MIRA · GUARDIANA",
      text: "Lo entiendo. Si cambias de idea, el portal seguirá esperando. El tiempo sabe ser paciente.",
      choices: [
        choice("volver", "He cambiado de idea.", "inicio", [
          { key: "confianza", op: "add", value: 1 },
        ]),
        choice("fin", "Marcharse.", null),
      ],
    },
  ],
};

export function cloneProject(project: DialogueProject): DialogueProject {
  return JSON.parse(JSON.stringify(project)) as DialogueProject;
}

export function createRuntime(project: DialogueProject): Runtime {
  return {
    nodeId: project.start,
    variables: { ...project.variables },
    history: [project.start],
    events: [],
    ended: false,
  };
}

export function getNode(project: DialogueProject, id: string | null): DialogueNode | null {
  if (!id) return null;
  return project.nodes.find((node) => node.id === id) ?? null;
}

function comparable(value: Value): number | string | boolean {
  return value;
}

export function conditionPasses(condition: Condition | undefined, variables: Record<string, Value>): boolean {
  if (!condition) return true;
  const left = comparable(variables[condition.key] ?? false);
  const right = comparable(condition.value);
  switch (condition.op) {
    case "==": return left === right;
    case "!=": return left !== right;
    case ">=": return Number(left) >= Number(right);
    case "<=": return Number(left) <= Number(right);
    case ">": return Number(left) > Number(right);
    case "<": return Number(left) < Number(right);
  }
}

export function describeCondition(condition: Condition | undefined): string {
  if (!condition) return "siempre disponible";
  return `${condition.key} ${condition.op} ${String(condition.value)}`;
}

export function applyEffect(variables: Record<string, Value>, effect: Effect): Record<string, Value> {
  const next = { ...variables };
  const current = next[effect.key];
  if (effect.op === "set") next[effect.key] = effect.value;
  if (effect.op === "add") next[effect.key] = Number(current ?? 0) + Number(effect.value);
  if (effect.op === "toggle") next[effect.key] = !Boolean(current);
  return next;
}

export function choose(project: DialogueProject, runtime: Runtime, choiceId: string): Runtime {
  const node = getNode(project, runtime.nodeId);
  if (!node || runtime.ended) return runtime;
  const selected = node.choices.find((item) => item.id === choiceId);
  if (!selected || !conditionPasses(selected.condition, runtime.variables)) return runtime;

  let variables = { ...runtime.variables };
  for (const effect of selected.effects) variables = applyEffect(variables, effect);

  const target = selected.target;
  const targetNode = getNode(project, target);
  const ended = target === null || !targetNode;
  const events = [...runtime.events];
  if (node.event && !events.includes(node.event)) events.push(node.event);
  events.push(`eleccion:${node.id}/${selected.id}`);
  if (targetNode?.event && !events.includes(targetNode.event)) events.push(targetNode.event);

  return {
    nodeId: ended ? null : target,
    variables,
    history: target ? [...runtime.history, target] : runtime.history,
    events,
    ended,
  };
}

export function setRuntimeVariable(runtime: Runtime, key: string, value: Value): Runtime {
  return { ...runtime, variables: { ...runtime.variables, [key]: value } };
}

export function validateProject(project: DialogueProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  for (const node of project.nodes) {
    if (!node.id.trim()) issues.push({ level: "error", message: "Hay un nodo sin ID" });
    if (ids.has(node.id)) issues.push({ level: "error", message: `ID duplicado: ${node.id}`, nodeId: node.id });
    ids.add(node.id);
    if (!node.text.trim()) issues.push({ level: "warning", message: "El nodo no tiene texto", nodeId: node.id });
    if (node.choices.length === 0) issues.push({ level: "warning", message: "El nodo no tiene elecciones ni final", nodeId: node.id });
    for (const item of node.choices) {
      if (!item.label.trim()) issues.push({ level: "warning", message: "Hay una elección sin texto", nodeId: node.id });
    }
  }
  if (!ids.has(project.start)) issues.push({ level: "error", message: `El nodo inicial '${project.start}' no existe` });

  for (const node of project.nodes) {
    for (const item of node.choices) {
      if (item.target !== null && !ids.has(item.target)) {
        issues.push({ level: "error", message: `Destino inexistente: ${item.target}`, nodeId: node.id });
      }
    }
  }

  // Búsqueda en profundidad: detecta nodos que ningún camino puede alcanzar.
  const reachable = new Set<string>();
  const visit = (id: string) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    const node = project.nodes.find((item) => item.id === id);
    node?.choices.forEach((item) => { if (item.target) visit(item.target); });
  };
  if (ids.has(project.start)) visit(project.start);
  for (const node of project.nodes) {
    if (!reachable.has(node.id)) issues.push({ level: "warning", message: "Nodo inalcanzable", nodeId: node.id });
  }
  return issues;
}

export function parseProject(text: string): DialogueProject {
  const parsed = JSON.parse(text) as DialogueProject;
  if (!parsed || !Array.isArray(parsed.nodes) || typeof parsed.start !== "string") {
    throw new Error("El JSON no tiene el formato de un proyecto narrativo");
  }
  const issues = validateProject(parsed);
  if (issues.some((item) => item.level === "error")) {
    throw new Error(issues.filter((item) => item.level === "error").map((item) => item.message).join(". "));
  }
  return parsed;
}

export function projectToJson(project: DialogueProject): string {
  return JSON.stringify(project, null, 2);
}

export function newNodeId(project: DialogueProject): string {
  let index = project.nodes.length + 1;
  while (project.nodes.some((node) => node.id === `nodo_${index}`)) index++;
  return `nodo_${index}`;
}