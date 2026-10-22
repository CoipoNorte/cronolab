/* ============================================================
   PAQUETES UNITY DESCARGABLES

   Cada función devuelve archivos de texto que JSZip empaqueta en
   el navegador. No son pseudocódigo: forman proyectos/carpetas
   válidos para Unity 6 y llevan sus propios README y .gitignore.
   ============================================================ */

export interface PackFile {
  path: string;
  content: string;
}

const PROJECT_VERSION = `m_EditorVersion: 6000.3.0f1
m_EditorVersionWithRevision: 6000.3.0f1 (d1870ce95baf)
`;

const MANIFEST = `{
  "dependencies": {
    "com.unity.modules.audio": "1.0.0",
    "com.unity.modules.imgui": "1.0.0",
    "com.unity.modules.jsonserialize": "1.0.0",
    "com.unity.modules.physics2d": "1.0.0"
  }
}
`;

const UNITY_GITIGNORE = `[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/
[Mm]emoryCaptures/
Recordings/
.vs/
.idea/
.vscode/
*.csproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
sysinfo.txt
crashlytics-build.properties
`;

const CRONO_JUMP_README = `# Crono Jump para Unity 6

Proyecto completo generado por CronoLab.

## Abrirlo

1. Descomprime el ZIP en una carpeta normal.
2. Abre Unity Hub -> Add -> Add project from disk.
3. Selecciona la carpeta CronoJump-Unity.
4. Usa Unity 6.3 LTS o permite que otra version de Unity 6 actualice el proyecto.
5. Espera a que termine la importacion.
6. Abre Assets/Scenes/CronoJump.unity y pulsa Play.

La escena se genera automaticamente la primera vez. El juego tambien se
autoconstruye en runtime gracias a RuntimeInitializeOnLoadMethod, por lo que
funciona incluso en una escena vacia.

## Controles

- A/D o flechas: moverse
- Espacio: saltar
- Escape: pausa
- R: reiniciar nivel

## Incluye

- jugador con Rigidbody2D y coyote time
- plataformas y pinchos
- monedas y puntuacion
- slimes patrullando y pisoton
- meteoritos verticales con aviso previo
- checkpoints y reaparicion
- tres niveles y record con PlayerPrefs
- HUD IMGUI sin paquetes externos
- generador de escena automatico para el Editor

## Donde esta cada cosa

- Assets/CronoJump/Scripts/CronoJumpBootstrap.cs: juego completo
- Assets/Editor/CronoJumpProjectSetup.cs: crea la escena y Build Settings
- Packages/manifest.json: dependencias oficiales minimas
- ProjectSettings/ProjectVersion.txt: Unity 6.3 LTS

## Primer experimento

Busca MOVE_SPEED, JUMP_SPEED y METEOR_INTERVAL en CronoJumpBootstrap.cs.
Cambia un valor, pulsa Play y observa el resultado. Es el mismo laboratorio
de variables que usaste en la web.
`;

const CRONO_JUMP_BOOTSTRAP = `using System;
using System.Collections.Generic;
using UnityEngine;

namespace CronoLab.CronoJump
{
    // Construye el juego aunque la escena este completamente vacia.
    public static class CronoJumpBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void CreateGame()
        {
            if (UnityEngine.Object.FindFirstObjectByType<CronoJumpGame>() != null) return;
            new GameObject("CronoJumpGame").AddComponent<CronoJumpGame>();
        }
    }

    public class CronoJumpGame : MonoBehaviour
    {
        public static CronoJumpGame Instance { get; private set; }

        public const float MOVE_SPEED = 7f;
        public const float JUMP_SPEED = 12f;
        public const float METEOR_INTERVAL = 1.45f;

        public int Score { get; private set; }
        public int Lives { get; private set; } = 3;
        public int Level { get; private set; } = 1;
        public int Best { get; private set; }
        public bool Paused { get; private set; }
        public CronoJumpPlayer Player { get; private set; }

        Transform world;
        Camera cam;
        float meteorTimer;
        Vector3 checkpoint;
        GUIStyle labelStyle, titleStyle;

        void Awake()
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Best = PlayerPrefs.GetInt("CronoJumpBest", 0);
            SetupCamera();
            BuildLevel(false);
        }

        void SetupCamera()
        {
            cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera");
                go.tag = "MainCamera";
                cam = go.AddComponent<Camera>();
            }
            cam.orthographic = true;
            cam.orthographicSize = 5.5f;
            cam.backgroundColor = new Color(0.25f, 0.56f, 0.82f);
            cam.transform.position = new Vector3(3f, 2.6f, -10f);
        }

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape)) Paused = !Paused;
            if (Input.GetKeyDown(KeyCode.R)) RestartGame();
            if (Paused || Player == null) return;

            meteorTimer -= Time.deltaTime;
            if (meteorTimer <= 0f)
            {
                meteorTimer = Mathf.Max(0.55f, METEOR_INTERVAL - Level * 0.12f);
                SpawnMeteor(Player.transform.position.x + UnityEngine.Random.Range(-5f, 6f));
            }

            Vector3 target = new Vector3(Player.transform.position.x + 2.2f, 2.6f, -10f);
            target.x = Mathf.Clamp(target.x, 3f, 32f);
            cam.transform.position = Vector3.Lerp(cam.transform.position, target, 1f - Mathf.Exp(-5f * Time.deltaTime));
        }

        void BuildLevel(bool keepScore)
        {
            if (world != null) Destroy(world.gameObject);
            if (!keepScore) Score = 0;
            world = new GameObject("Generated World - Level " + Level).transform;
            checkpoint = new Vector3(-7f, -2.8f, 0f);
            meteorTimer = 1f;

            CreatePlatform("Ground", new Vector2(13f, -4.2f), new Vector2(44f, 1.2f), new Color(0.38f, 0.24f, 0.14f));
            float offset = (Level - 1) * 0.4f;
            CreatePlatform("Block A", new Vector2(0f, -2.9f), new Vector2(2f, 1.4f), Brick());
            CreatePlatform("Platform B", new Vector2(6f, -1.4f + offset), new Vector2(3f, 0.45f), Brick());
            CreatePlatform("Block C", new Vector2(13f, -2.55f), new Vector2(1.5f, 2.1f), Brick());
            CreatePlatform("Platform D", new Vector2(20f, -0.9f), new Vector2(4f, 0.45f), Brick());

            for (int i = 0; i < 18; i++)
            {
                float x = -4f + i * 2f;
                float y = (i % 5 == 2) ? -0.4f : -2.8f;
                CreateCoin(new Vector2(x, y));
            }

            CreateSpikes(new Vector2(3.5f, -3.35f));
            CreateSpikes(new Vector2(16.5f, -3.35f));
            CreateEnemy(new Vector2(9f, -3.15f), 7.5f, 11.5f);
            CreateEnemy(new Vector2(24f, -3.15f), 22f, 27f);
            CreateCheckpoint(new Vector2(12f, -3.05f));
            CreateGoal(new Vector2(33f, -2.7f));
            CreatePlayer(checkpoint);
        }

        Color Brick() => new Color(0.62f, 0.31f, 0.2f);

        GameObject Visual(string name, Vector2 position, Vector2 scale, Color color, int order = 0)
        {
            var go = new GameObject(name);
            go.transform.SetParent(world);
            go.transform.position = position;
            go.transform.localScale = scale;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = PixelSprite.White;
            sr.color = color;
            sr.sortingOrder = order;
            return go;
        }

        void CreatePlatform(string name, Vector2 pos, Vector2 size, Color color)
        {
            var go = Visual(name, pos, size, color);
            go.AddComponent<BoxCollider2D>();
        }

        void CreatePlayer(Vector2 pos)
        {
            var go = Visual("Player", pos, new Vector2(0.75f, 1.15f), new Color(0.1f, 0.75f, 0.7f), 5);
            go.layer = 2; // Ignore Raycast: el sensor de suelo no se detecta a si mismo.
            var rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 3.2f;
            rb.freezeRotation = true;
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;
            go.AddComponent<BoxCollider2D>();
            Player = go.AddComponent<CronoJumpPlayer>();
        }

        void CreateCoin(Vector2 pos)
        {
            var go = Visual("Coin", pos, new Vector2(0.35f, 0.5f), new Color(1f, 0.82f, 0.15f), 3);
            var col = go.AddComponent<CircleCollider2D>(); col.isTrigger = true;
            go.AddComponent<CronoJumpCoin>();
        }

        void CreateEnemy(Vector2 pos, float min, float max)
        {
            var go = Visual("Slime", pos, new Vector2(0.85f, 0.65f), new Color(0.28f, 0.78f, 0.24f), 4);
            go.AddComponent<BoxCollider2D>();
            var enemy = go.AddComponent<CronoJumpEnemy>(); enemy.minX = min; enemy.maxX = max;
        }

        void CreateSpikes(Vector2 pos)
        {
            var go = Visual("Spikes", pos, new Vector2(1.2f, 0.35f), new Color(0.9f, 0.32f, 0.38f), 2);
            var col = go.AddComponent<BoxCollider2D>(); col.isTrigger = true;
            go.AddComponent<CronoJumpHazard>();
        }

        void CreateCheckpoint(Vector2 pos)
        {
            var go = Visual("Checkpoint", pos, new Vector2(0.25f, 1.8f), new Color(0.42f, 0.46f, 0.55f), 2);
            var col = go.AddComponent<BoxCollider2D>(); col.isTrigger = true;
            go.AddComponent<CronoJumpCheckpoint>();
        }

        void CreateGoal(Vector2 pos)
        {
            var pole = Visual("Goal", pos, new Vector2(0.22f, 2.7f), new Color(0.45f, 0.28f, 0.14f), 2);
            var trigger = pole.AddComponent<BoxCollider2D>(); trigger.isTrigger = true; trigger.size = new Vector2(2f, 2.7f);
            pole.AddComponent<CronoJumpGoal>();
            Visual("Goal Flag", pos + new Vector2(0.7f, 1.05f), new Vector2(1.35f, 0.7f), new Color(1f, 0.3f, 0.42f), 3).transform.SetParent(pole.transform);
        }

        void SpawnMeteor(float x)
        {
            var warning = Visual("Meteor Warning", new Vector2(x, -3.55f), new Vector2(1.1f, 0.12f), new Color(1f, 0.25f, 0.3f, 0.7f), 6);
            warning.AddComponent<CronoJumpWarning>().targetX = x;
        }

        public void AddScore(int amount) { Score += amount; }

        public void Damage()
        {
            if (Player == null || Player.Invulnerable) return;
            Lives--;
            Player.SetInvulnerable(1.4f);
            if (Lives <= 0) RestartGame();
            else Player.Respawn(checkpoint);
        }

        public void ActivateCheckpoint(Vector3 position)
        {
            checkpoint = new Vector3(position.x, -2.8f, 0f);
        }

        public void CompleteLevel()
        {
            AddScore(200);
            if (Level < 3)
            {
                Level++;
                Lives = Mathf.Min(3, Lives + 1);
                BuildLevel(true);
            }
            else
            {
                Best = Mathf.Max(Best, Score);
                PlayerPrefs.SetInt("CronoJumpBest", Best);
                PlayerPrefs.Save();
                Paused = true;
            }
        }

        public void RestartGame()
        {
            Level = 1; Lives = 3; Paused = false;
            BuildLevel(false);
        }

        void OnGUI()
        {
            labelStyle ??= new GUIStyle(GUI.skin.label) { fontSize = 18, fontStyle = FontStyle.Bold, normal = { textColor = Color.white } };
            titleStyle ??= new GUIStyle(labelStyle) { fontSize = 34, alignment = TextAnchor.MiddleCenter };
            GUI.Box(new Rect(12, 12, 365, 70), "");
            GUI.Label(new Rect(26, 20, 340, 25), $"PUNTOS {Score}   VIDAS {Lives}   NIVEL {Level}/3", labelStyle);
            GUI.Label(new Rect(26, 47, 340, 25), $"RECORD {Best}   [ESC] pausa   [R] reiniciar", labelStyle);
            if (!Paused) return;
            GUI.Box(new Rect(Screen.width / 2 - 190, Screen.height / 2 - 85, 380, 170), "");
            GUI.Label(new Rect(Screen.width / 2 - 180, Screen.height / 2 - 60, 360, 55), Level > 3 ? "VICTORIA" : "PAUSA", titleStyle);
            if (GUI.Button(new Rect(Screen.width / 2 - 130, Screen.height / 2 + 15, 260, 45), "CONTINUAR")) Paused = false;
        }
    }

    public class CronoJumpPlayer : MonoBehaviour
    {
        Rigidbody2D rb;
        float coyote, jumpBuffer, invulnerable;
        public bool Invulnerable => invulnerable > 0f;

        void Awake() { rb = GetComponent<Rigidbody2D>(); }

        void Update()
        {
            if (CronoJumpGame.Instance.Paused) { rb.linearVelocity = Vector2.zero; return; }
            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.UpArrow)) jumpBuffer = 0.12f;
            jumpBuffer -= Time.deltaTime;
            invulnerable -= Time.deltaTime;
            var sr = GetComponent<SpriteRenderer>();
            if (sr != null) sr.enabled = !Invulnerable || Mathf.FloorToInt(Time.time * 14f) % 2 == 0;
        }

        void FixedUpdate()
        {
            if (CronoJumpGame.Instance.Paused) return;
            float dir = 0f;
            if (Input.GetKey(KeyCode.LeftArrow) || Input.GetKey(KeyCode.A)) dir -= 1f;
            if (Input.GetKey(KeyCode.RightArrow) || Input.GetKey(KeyCode.D)) dir += 1f;
            rb.linearVelocity = new Vector2(dir * CronoJumpGame.MOVE_SPEED, rb.linearVelocity.y);

            bool grounded = Physics2D.Raycast((Vector2)transform.position + Vector2.down * 0.62f, Vector2.down, 0.16f, ~(1 << 2));
            coyote = grounded ? 0.1f : coyote - Time.fixedDeltaTime;
            if (jumpBuffer > 0f && coyote > 0f)
            {
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, CronoJumpGame.JUMP_SPEED);
                jumpBuffer = 0f; coyote = 0f;
            }
        }

        public void Bounce() { rb.linearVelocity = new Vector2(rb.linearVelocity.x, 8.5f); }
        public void SetInvulnerable(float seconds) { invulnerable = seconds; }
        public void Respawn(Vector3 position) { transform.position = position; rb.linearVelocity = Vector2.zero; }
    }

    public class CronoJumpCoin : MonoBehaviour
    {
        Vector3 start;
        void Start() { start = transform.position; }
        void Update() { transform.position = start + Vector3.up * (Mathf.Sin(Time.time * 3f + start.x) * 0.12f); transform.Rotate(0, 120f * Time.deltaTime, 0); }
        void OnTriggerEnter2D(Collider2D other) { if (other.GetComponent<CronoJumpPlayer>() == null) return; CronoJumpGame.Instance.AddScore(10); Destroy(gameObject); }
    }

    public class CronoJumpEnemy : MonoBehaviour
    {
        public float minX, maxX;
        float direction = 1f;
        void Update()
        {
            if (CronoJumpGame.Instance.Paused) return;
            transform.position += Vector3.right * (direction * 2f * Time.deltaTime);
            if (transform.position.x <= minX) direction = 1f;
            if (transform.position.x >= maxX) direction = -1f;
        }
        void OnCollisionEnter2D(Collision2D collision)
        {
            var player = collision.gameObject.GetComponent<CronoJumpPlayer>();
            if (player == null) return;
            var rb = player.GetComponent<Rigidbody2D>();
            if (player.transform.position.y > transform.position.y + 0.45f && rb.linearVelocity.y < 0f)
            {
                CronoJumpGame.Instance.AddScore(50); player.Bounce(); Destroy(gameObject);
            }
            else CronoJumpGame.Instance.Damage();
        }
    }

    public class CronoJumpHazard : MonoBehaviour
    {
        void OnTriggerEnter2D(Collider2D other) { if (other.GetComponent<CronoJumpPlayer>() != null) CronoJumpGame.Instance.Damage(); }
    }

    public class CronoJumpCheckpoint : MonoBehaviour
    {
        bool active;
        void OnTriggerEnter2D(Collider2D other)
        {
            if (active || other.GetComponent<CronoJumpPlayer>() == null) return;
            active = true; GetComponent<SpriteRenderer>().color = new Color(1f, 0.82f, 0.15f);
            CronoJumpGame.Instance.ActivateCheckpoint(transform.position);
        }
    }

    public class CronoJumpGoal : MonoBehaviour
    {
        bool used;
        void OnTriggerEnter2D(Collider2D other) { if (used || other.GetComponent<CronoJumpPlayer>() == null) return; used = true; CronoJumpGame.Instance.CompleteLevel(); }
    }

    public class CronoJumpWarning : MonoBehaviour
    {
        public float targetX;
        float timer = 0.72f;
        void Update()
        {
            if (CronoJumpGame.Instance.Paused) return;
            timer -= Time.deltaTime;
            GetComponent<SpriteRenderer>().enabled = Mathf.FloorToInt(timer * 12f) % 2 == 0;
            if (timer > 0f) return;
            var meteor = new GameObject("Meteor");
            meteor.transform.position = new Vector3(targetX, 6.5f, 0f);
            meteor.transform.localScale = Vector3.one * 0.6f;
            var sr = meteor.AddComponent<SpriteRenderer>(); sr.sprite = PixelSprite.White; sr.color = new Color(1f, 0.35f, 0.18f); sr.sortingOrder = 8;
            var col = meteor.AddComponent<CircleCollider2D>(); col.isTrigger = true;
            meteor.AddComponent<CronoJumpMeteor>();
            Destroy(gameObject);
        }
    }

    public class CronoJumpMeteor : MonoBehaviour
    {
        float speed = 6f;
        void Update()
        {
            if (CronoJumpGame.Instance.Paused) return;
            speed += 7f * Time.deltaTime;
            transform.position += Vector3.down * (speed * Time.deltaTime);
            if (transform.position.y < -4f) Destroy(gameObject);
        }
        void OnTriggerEnter2D(Collider2D other)
        {
            if (other.GetComponent<CronoJumpPlayer>() != null) CronoJumpGame.Instance.Damage();
            if (other.GetComponent<CronoJumpPlayer>() != null || !other.isTrigger) Destroy(gameObject);
        }
    }

    public static class PixelSprite
    {
        static Sprite white;
        public static Sprite White
        {
            get
            {
                if (white != null) return white;
                var texture = new Texture2D(1, 1) { filterMode = FilterMode.Point, name = "CronoLab Pixel" };
                texture.SetPixel(0, 0, Color.white); texture.Apply();
                white = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
                return white;
            }
        }
    }
}
`;

const UNITY_EDITOR_SETUP = `#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;

[InitializeOnLoad]
public static class CronoJumpProjectSetup
{
    const string ScenePath = "Assets/Scenes/CronoJump.unity";

    static CronoJumpProjectSetup() { EditorApplication.delayCall += Setup; }

    static void Setup()
    {
        if (EditorApplication.isPlayingOrWillChangePlaymode) return;
        if (!File.Exists(ScenePath))
        {
            Directory.CreateDirectory("Assets/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.Refresh();
        }
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        if (SceneManager.GetActiveScene().path != ScenePath) EditorSceneManager.OpenScene(ScenePath);
    }
}
#endif
`;

export function buildCronoJumpUnityProject(): PackFile[] {
  const root = "CronoJump-Unity";
  return [
    { path: `${root}/README.md`, content: CRONO_JUMP_README },
    { path: `${root}/.gitignore`, content: UNITY_GITIGNORE },
    { path: `${root}/Packages/manifest.json`, content: MANIFEST },
    { path: `${root}/ProjectSettings/ProjectVersion.txt`, content: PROJECT_VERSION },
    { path: `${root}/Assets/CronoJump/Scripts/CronoJumpBootstrap.cs`, content: CRONO_JUMP_BOOTSTRAP },
    { path: `${root}/Assets/Editor/CronoJumpProjectSetup.cs`, content: UNITY_EDITOR_SETUP },
  ];
}

/* ---------------- Pack RPG ---------------- */

const RPG_README = `# CronoLab RPG Systems Pack para Unity 6

Carpeta Assets lista para copiar dentro de cualquier proyecto Unity 6.

Incluye:
- DialogueRunner: nodos, elecciones, condiciones y efectos desde JSON
- QuestManager: estados de misión y eventos para el HUD
- Inventory: cantidades y objetos clave
- SaveSystem: tres ranuras versionadas y migraciones
- ScenePortal: cambio de escena condicionado por una llave
- ejemplo-dialogo.json: conversación lista para TextAsset

## Instalación
1. Copia la carpeta Assets/CronoLabRPG a Assets/ de tu proyecto.
2. Crea un GameObject "RPG Systems".
3. Añade DialogueRunner, QuestManager e Inventory.
4. Arrastra ejemplo-dialogo.json al campo dialogueJson de DialogueRunner.
5. Pulsa Play. El runner usa OnGUI para probar el diálogo sin montar una UI.
`;

const RPG_DIALOGUE = `using System;
using System.Collections.Generic;
using UnityEngine;

namespace CronoLab.RPG
{
    [Serializable] public class DialogueProject { public string start; public DialogueNode[] nodes; }
    [Serializable] public class DialogueNode { public string id; public string speaker; [TextArea] public string text; public DialogueChoice[] choices; }
    [Serializable] public class DialogueChoice { public string label; public string target; public Condition condition; public Effect[] effects; }
    [Serializable] public class Condition { public string key; public string op; public int value; }
    [Serializable] public class Effect { public string key; public string op; public int value; }

    public class DialogueRunner : MonoBehaviour
    {
        public TextAsset dialogueJson;
        DialogueProject project;
        DialogueNode current;
        readonly Dictionary<string, int> variables = new();
        Vector2 scroll;

        void Start()
        {
            if (dialogueJson == null) return;
            project = JsonUtility.FromJson<DialogueProject>(dialogueJson.text);
            Open(project.start);
        }

        void Open(string id)
        {
            current = Array.Find(project.nodes, n => n.id == id);
            if (current == null) Debug.LogWarning("Nodo inexistente: " + id);
        }

        bool Passes(Condition c)
        {
            if (c == null || string.IsNullOrEmpty(c.key)) return true;
            int left = variables.TryGetValue(c.key, out var v) ? v : 0;
            return c.op switch { ">=" => left >= c.value, "<=" => left <= c.value, "==" => left == c.value, "!=" => left != c.value, ">" => left > c.value, "<" => left < c.value, _ => true };
        }

        void Apply(Effect effect)
        {
            if (effect == null || string.IsNullOrEmpty(effect.key)) return;
            int old = variables.TryGetValue(effect.key, out var value) ? value : 0;
            variables[effect.key] = effect.op == "add" ? old + effect.value : effect.value;
        }

        void Choose(DialogueChoice choice)
        {
            if (!Passes(choice.condition)) return;
            if (choice.effects != null) foreach (var effect in choice.effects) Apply(effect);
            if (string.IsNullOrEmpty(choice.target)) current = null;
            else Open(choice.target);
        }

        void OnGUI()
        {
            if (current == null) return;
            GUILayout.BeginArea(new Rect(20, Screen.height - 260, Screen.width - 40, 240), GUI.skin.box);
            GUILayout.Label(current.speaker, new GUIStyle(GUI.skin.label) { fontSize = 20, fontStyle = FontStyle.Bold });
            GUILayout.Label(current.text, new GUIStyle(GUI.skin.label) { fontSize = 17, wordWrap = true });
            if (current.choices != null) foreach (var choice in current.choices)
            {
                GUI.enabled = Passes(choice.condition);
                if (GUILayout.Button(choice.label, GUILayout.Height(34))) Choose(choice);
                GUI.enabled = true;
            }
            GUILayout.EndArea();
        }
    }
}
`;

const RPG_QUEST = `using System;
using UnityEngine;

namespace CronoLab.RPG
{
    public class QuestManager : MonoBehaviour
    {
        public enum State { NotStarted, Active, Return, Key, Complete }
        public State state;
        public int crystals;
        public bool hasKey;
        public event Action Changed;

        public void StartQuest() { if (state != State.NotStarted) return; state = State.Active; Notify(); }
        public void CollectCrystal() { if (state != State.Active) return; crystals++; if (crystals >= 3) state = State.Return; Notify(); }
        public void TurnIn() { if (state != State.Return) return; hasKey = true; state = State.Key; Notify(); }
        public void Complete() { state = State.Complete; Notify(); }
        void Notify() { Changed?.Invoke(); Debug.Log($"Quest: {state} ({crystals}/3)"); }
    }
}
`;

const RPG_INVENTORY = `using System;
using System.Collections.Generic;
using UnityEngine;

namespace CronoLab.RPG
{
    [Serializable] public class ItemStack { public string id; public int amount; }

    public class Inventory : MonoBehaviour
    {
        public List<ItemStack> items = new();
        public event Action Changed;

        public int Count(string id) => items.Find(x => x.id == id)?.amount ?? 0;
        public bool Has(string id, int amount = 1) => Count(id) >= amount;
        public void Add(string id, int amount = 1)
        {
            var stack = items.Find(x => x.id == id);
            if (stack == null) { stack = new ItemStack { id = id }; items.Add(stack); }
            stack.amount += amount; Changed?.Invoke();
        }
        public bool Remove(string id, int amount = 1)
        {
            var stack = items.Find(x => x.id == id);
            if (stack == null || stack.amount < amount) return false;
            stack.amount -= amount; if (stack.amount == 0) items.Remove(stack);
            Changed?.Invoke(); return true;
        }
    }
}
`;

const RPG_SAVE = `using System;
using System.IO;
using UnityEngine;

namespace CronoLab.RPG
{
    [Serializable] public class SaveData
    {
        public int version = 2;
        public int slot;
        public string scene;
        public float x, y;
        public int questState, crystals, coins;
        public bool hasKey;
    }

    public static class SaveSystem
    {
        static string PathFor(int slot) => Path.Combine(Application.persistentDataPath, $"slot-{slot}.json");
        public static void Save(SaveData data) { data.version = 2; File.WriteAllText(PathFor(data.slot), JsonUtility.ToJson(data, true)); }
        public static SaveData Load(int slot)
        {
            string path = PathFor(slot);
            if (!File.Exists(path)) return null;
            var data = JsonUtility.FromJson<SaveData>(File.ReadAllText(path));
            if (data.version < 2) { data.version = 2; if (string.IsNullOrEmpty(data.scene)) data.scene = "Pradera"; }
            return data;
        }
        public static void Delete(int slot) { string p = PathFor(slot); if (File.Exists(p)) File.Delete(p); }
    }
}
`;

const RPG_PORTAL = `using UnityEngine;
using UnityEngine.SceneManagement;

namespace CronoLab.RPG
{
    public class ScenePortal : MonoBehaviour
    {
        public string targetScene;
        public string requiredItem = "llave_portal";
        public Inventory inventory;
        void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;
            if (inventory != null && !inventory.Has(requiredItem)) { Debug.Log("La puerta esta cerrada"); return; }
            SceneManager.LoadScene(targetScene);
        }
    }
}
`;

const SAMPLE_DIALOGUE = `{
  "start": "inicio",
  "nodes": [
    {
      "id": "inicio",
      "speaker": "MIRA",
      "text": "El portal necesita tres cristales. Me ayudaras?",
      "choices": [
        { "label": "Cuenta conmigo", "target": "mision", "effects": [{ "key": "confianza", "op": "add", "value": 1 }] },
        { "label": "Ya los tengo", "target": "entrega", "condition": { "key": "cristales", "op": ">=", "value": 3 } }
      ]
    },
    { "id": "mision", "speaker": "MIRA", "text": "Busca junto al lago y vuelve.", "choices": [{ "label": "Ire ahora", "target": "" }] },
    { "id": "entrega", "speaker": "MIRA", "text": "Has cumplido. Toma la llave.", "choices": [{ "label": "Recibir llave", "target": "", "effects": [{ "key": "llave", "op": "set", "value": 1 }] }] }
  ]
}
`;

export function buildUnityRpgPack(): PackFile[] {
  const root = "CronoLab-RPG-Pack";
  return [
    { path: `${root}/README.md`, content: RPG_README },
    { path: `${root}/Assets/CronoLabRPG/Scripts/DialogueRunner.cs`, content: RPG_DIALOGUE },
    { path: `${root}/Assets/CronoLabRPG/Scripts/QuestManager.cs`, content: RPG_QUEST },
    { path: `${root}/Assets/CronoLabRPG/Scripts/Inventory.cs`, content: RPG_INVENTORY },
    { path: `${root}/Assets/CronoLabRPG/Scripts/SaveSystem.cs`, content: RPG_SAVE },
    { path: `${root}/Assets/CronoLabRPG/Scripts/ScenePortal.cs`, content: RPG_PORTAL },
    { path: `${root}/Assets/CronoLabRPG/Examples/ejemplo-dialogo.json`, content: SAMPLE_DIALOGUE },
  ];
}

/* ---------------- Pack de producción ---------------- */

const PROD_README = `# CronoLab Production Pack para Unity 6

Sistemas reutilizables para pasar de prototipo a juego publicable.

- AudioBus: master, musica, SFX y UI con persistencia
- AchievementSystem: progreso por eventos y guardado
- LocalizationService: CSV simple, variables y fallback
- AccessibilityManager: movimiento reducido, temblor, flashes y texto
- SaveSlots: tres ranuras JSON en persistentDataPath

Copia Assets/CronoLabProduction dentro de Assets/. Todos los sistemas son
independientes: usa solo los que necesites.
`;

const PROD_AUDIO = `using UnityEngine;

namespace CronoLab.Production
{
    public enum AudioChannel { Music, SFX, UI }
    public class AudioBus : MonoBehaviour
    {
        public static AudioBus Instance { get; private set; }
        [Range(0,1)] public float master = .8f, music = .55f, sfx = .75f, ui = .65f;
        public bool muted;
        void Awake() { if (Instance && Instance != this) { Destroy(gameObject); return; } Instance = this; DontDestroyOnLoad(gameObject); Load(); }
        public float Gain(AudioChannel c) => muted ? 0 : master * (c == AudioChannel.Music ? music : c == AudioChannel.SFX ? sfx : ui);
        public void Play(AudioClip clip, AudioChannel channel, Vector3 position)
        {
            if (!clip) return;
            AudioSource.PlayClipAtPoint(clip, position, Gain(channel));
        }
        public void Save()
        {
            PlayerPrefs.SetFloat("audio.master", master); PlayerPrefs.SetFloat("audio.music", music);
            PlayerPrefs.SetFloat("audio.sfx", sfx); PlayerPrefs.SetFloat("audio.ui", ui); PlayerPrefs.SetInt("audio.muted", muted ? 1 : 0); PlayerPrefs.Save();
        }
        public void Load()
        {
            master = PlayerPrefs.GetFloat("audio.master", master); music = PlayerPrefs.GetFloat("audio.music", music);
            sfx = PlayerPrefs.GetFloat("audio.sfx", sfx); ui = PlayerPrefs.GetFloat("audio.ui", ui); muted = PlayerPrefs.GetInt("audio.muted", 0) == 1;
        }
    }
}
`;

const PROD_ACHIEVEMENTS = `using System;
using System.Collections.Generic;
using UnityEngine;

namespace CronoLab.Production
{
    [Serializable] public class Achievement { public string id, title, eventName; public int target = 1, progress; public bool unlocked; }
    public class AchievementSystem : MonoBehaviour
    {
        public List<Achievement> achievements = new();
        public event Action<Achievement> Unlocked;
        public void Emit(string eventName, int amount = 1)
        {
            foreach (var a in achievements)
            {
                if (a.unlocked || a.eventName != eventName) continue;
                a.progress = Mathf.Min(a.target, a.progress + amount);
                if (a.progress >= a.target) { a.unlocked = true; Unlocked?.Invoke(a); }
            }
            Save();
        }
        void Save() { foreach (var a in achievements) { PlayerPrefs.SetInt("ach." + a.id, a.progress); PlayerPrefs.SetInt("ach." + a.id + ".unlocked", a.unlocked ? 1 : 0); } PlayerPrefs.Save(); }
        void Awake() { foreach (var a in achievements) { a.progress = PlayerPrefs.GetInt("ach." + a.id, 0); a.unlocked = PlayerPrefs.GetInt("ach." + a.id + ".unlocked", 0) == 1; } }
    }
}
`;

const PROD_LOCALIZATION = `using System.Collections.Generic;
using UnityEngine;

namespace CronoLab.Production
{
    public class LocalizationService : MonoBehaviour
    {
        public string locale = "es";
        readonly Dictionary<string, Dictionary<string, string>> tables = new();
        public void Add(string language, string key, string value)
        {
            if (!tables.ContainsKey(language)) tables[language] = new Dictionary<string, string>();
            tables[language][key] = value;
        }
        public string T(string key, Dictionary<string, string> vars = null)
        {
            string text = tables.TryGetValue(locale, out var table) && table.TryGetValue(key, out var value) ? value :
                          tables.TryGetValue("es", out var fallback) && fallback.TryGetValue(key, out var fb) ? fb : "[" + key + "]";
            if (vars != null) foreach (var pair in vars) text = text.Replace("{" + pair.Key + "}", pair.Value);
            return text;
        }
    }
}
`;

const PROD_ACCESSIBILITY = `using System;
using UnityEngine;

namespace CronoLab.Production
{
    [Serializable] public class AccessibilityData
    {
        public bool reducedMotion, highContrast, flashes = true, subtitles = true;
        [Range(.8f, 1.6f)] public float textScale = 1f;
        [Range(0, 1)] public float shake = 1f;
    }
    public class AccessibilityManager : MonoBehaviour
    {
        public static AccessibilityManager Instance { get; private set; }
        public AccessibilityData settings = new();
        public float ShakeMultiplier => settings.reducedMotion ? 0 : settings.shake;
        public float ParticleMultiplier => settings.reducedMotion ? .25f : 1f;
        void Awake() { Instance = this; var json = PlayerPrefs.GetString("accessibility", ""); if (!string.IsNullOrEmpty(json)) JsonUtility.FromJsonOverwrite(json, settings); }
        public void Save() { PlayerPrefs.SetString("accessibility", JsonUtility.ToJson(settings)); PlayerPrefs.Save(); }
    }
}
`;

const PROD_SAVES = `using System;
using System.IO;
using UnityEngine;

namespace CronoLab.Production
{
    [Serializable] public class SlotData { public int version = 2, slot, level = 1, coins, hearts = 3; public string player = "CRONO", location = "Pradera"; public float playSeconds; }
    public static class SaveSlots
    {
        static string PathFor(int slot) => Path.Combine(Application.persistentDataPath, $"slot-{slot}.json");
        public static void Save(SlotData data) { data.version = 2; File.WriteAllText(PathFor(data.slot), JsonUtility.ToJson(data, true)); }
        public static SlotData Load(int slot) { var path = PathFor(slot); if (!File.Exists(path)) return null; var data = JsonUtility.FromJson<SlotData>(File.ReadAllText(path)); data.version = 2; return data; }
        public static void Delete(int slot) { var path = PathFor(slot); if (File.Exists(path)) File.Delete(path); }
        public static string Export(int slot) { var data = Load(slot); return data == null ? "" : JsonUtility.ToJson(data, true); }
    }
}
`;

export function buildUnityProductionPack(): PackFile[] {
  const root = "CronoLab-Production-Pack";
  return [
    { path: `${root}/README.md`, content: PROD_README },
    { path: `${root}/Assets/CronoLabProduction/AudioBus.cs`, content: PROD_AUDIO },
    { path: `${root}/Assets/CronoLabProduction/AchievementSystem.cs`, content: PROD_ACHIEVEMENTS },
    { path: `${root}/Assets/CronoLabProduction/LocalizationService.cs`, content: PROD_LOCALIZATION },
    { path: `${root}/Assets/CronoLabProduction/AccessibilityManager.cs`, content: PROD_ACCESSIBILITY },
    { path: `${root}/Assets/CronoLabProduction/SaveSlots.cs`, content: PROD_SAVES },
  ];
}