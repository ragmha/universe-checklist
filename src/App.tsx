import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleHelp,
  Code2,
  Download,
  FlaskConical,
  Info,
  MapPin,
  MessageSquareText,
  Mic2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  Home,
  Search,
  ListChecks,
  PlayCircle,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "universe-checklist.v1";
const EVENT_TIME_ZONE = "America/Los_Angeles";
const TRACK_URL = "https://reg.githubuniverse.com/flow/github/universe26/attendee-portal/page/sessioncatalog?tab.allsessions=1783449560443001ldrh&search.curatedagenda=1790773278100004cDIo";
const CATALOG_ROOT = "https://reg.githubuniverse.com/flow/github/universe26/attendee-portal/page/sessioncatalog/session/";
const DAYS = [
  { value: "2026-10-28", short: "WED", date: "OCT 28", label: "Wednesday, October 28" },
  { value: "2026-10-29", short: "THU", date: "OCT 29", label: "Thursday, October 29" },
] as const;
const STATUS_OPTIONS = [
  { value: "check", label: "Set availability" },
  { value: "open", label: "Open" },
  { value: "full", label: "Full" },
  { value: "standby", label: "Standby" },
] as const;
const GROUPS = [
  { value: "plan", label: "Your plan" },
  { value: "optional", label: "Optional" },
  { value: "swap", label: "Possible swaps" },
] as const;

type Day = (typeof DAYS)[number]["value"];
type SessionGroup = (typeof GROUPS)[number]["value"];
type Availability = (typeof STATUS_OPTIONS)[number]["value"];
type FocusKind = "now" | "next" | "";

interface Session {
  id: string;
  catalogId: string;
  day: Day;
  start: string;
  end: string;
  title: string;
  kind: string;
  venue: string;
  why: string;
  group: SessionGroup;
  replay?: string;
  transition?: string;
}

interface SavedState {
  completed: string[];
  availability: Record<string, Availability>;
}

interface FocusState {
  session: Session | null;
  kind: FocusKind;
  day: string;
  minute: number;
  timestamp: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isDay(value: unknown): value is Day {
  return DAYS.some((day) => day.value === value);
}

function isGroup(value: unknown): value is SessionGroup {
  return GROUPS.some((group) => group.value === value);
}

function isAvailability(value: unknown): value is Availability {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return typeof session.id === "string"
    && typeof session.catalogId === "string"
    && isDay(session.day)
    && typeof session.start === "string"
    && typeof session.end === "string"
    && typeof session.title === "string"
    && typeof session.kind === "string"
    && typeof session.venue === "string"
    && typeof session.why === "string"
    && isGroup(session.group);
}

function readSavedState(sessions: Session[]): { state: SavedState; message?: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { state: { completed: [], availability: {} } };
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") throw new Error("Saved checklist data has an invalid format.");

    const record = parsed as Record<string, unknown>;
    const knownIds = new Set(sessions.map((session) => session.id));
    const completed = Array.isArray(record.completed)
      ? [...new Set(record.completed.filter((id): id is string => typeof id === "string" && knownIds.has(id)))]
      : [];
    const availability = record.availability && typeof record.availability === "object"
      ? Object.fromEntries(
        Object.entries(record.availability).filter(([id, value]) => knownIds.has(id) && isAvailability(value) && value !== "check"),
      ) as Record<string, Availability>
      : {};

    return { state: { completed, availability } };
  } catch {
    return {
      state: { completed: [], availability: {} },
      message: "Saved progress could not be read. Your checklist starts fresh on this device.",
    };
  }
}

function timeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/u);
  if (!match) throw new Error(`Invalid session time: ${time}`);
  let hour = Number(match[1]) % 12;
  if (match[3] === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}

function timestampFor(day: string, time: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date, 0, timeToMinutes(time));
}

function eventClock(now = new Date()): Omit<FocusState, "session" | "kind"> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value;
  const day = `${part("year")}-${part("month")}-${part("day")}`;
  const minute = Number(part("hour")) * 60 + Number(part("minute"));
  const [year, month, date] = day.split("-").map(Number);
  return { day, minute, timestamp: Date.UTC(year, month - 1, date, 0, minute) };
}

function getFocusState(sessions: Session[], completed: string[], now = new Date()): FocusState {
  const clock = eventClock(now);
  const planned = sessions.filter((session) => session.group === "plan" && !completed.includes(session.id));
  const active = planned.find((session) =>
    session.day === clock.day
    && clock.minute >= timeToMinutes(session.start)
    && clock.minute < timeToMinutes(session.end));
  if (active) return { ...clock, session: active, kind: "now" };

  const upcoming = planned
    .map((session) => ({ session, timestamp: timestampFor(session.day, session.start) }))
    .filter(({ timestamp }) => timestamp > clock.timestamp)
    .sort((a, b) => a.timestamp - b.timestamp)[0];
  return upcoming
    ? { ...clock, session: upcoming.session, kind: "next" }
    : { ...clock, session: null, kind: "" };
}

function formatUntil(minutes: number): string {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes} min`;
}

function getSessionIcon(kind: string): LucideIcon {
  const normalized = kind.toLowerCase();
  if (normalized.includes("keynote")) return Mic2;
  if (normalized.includes("demo")) return FlaskConical;
  if (normalized.includes("sandbox")) return Terminal;
  if (normalized.includes("workshop") || normalized.includes("lab")) return Wrench;
  if (normalized.includes("breakout")) return MessageSquareText;
  if (normalized.includes("fireside")) return Sparkles;
  if (normalized.includes("security")) return ShieldCheck;
  if (normalized.includes("code")) return Code2;
  if (normalized.includes("qa") || normalized.includes("q&a")) return CircleHelp;
  return CalendarDays;
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [state, setState] = useState<SavedState>({ completed: [], availability: {} });
  const [currentDay, setCurrentDay] = useState<Day>("2026-10-28");
  const [clock, setClock] = useState(() => Date.now());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"agenda" | "completed" | "replays">("agenda");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSessions() {
      try {
        const response = await fetch("/sessions.json", { signal: controller.signal });
        if (!response.ok) throw new Error(`Session list request failed (${response.status}).`);
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object" || !Array.isArray((payload as { sessions?: unknown }).sessions)) {
          throw new Error("The session list has an invalid format.");
        }
        const records = (payload as { sessions: unknown[] }).sessions;
        if (!records.every(isSession)) throw new Error("One or more session records are incomplete.");
        setSessions(records);
        const saved = readSavedState(records);
        setState(saved.state);
        if (saved.message) setMessage(saved.message);
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE }).format(new Date());
        if (isDay(today)) setCurrentDay(today);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMessage(error instanceof Error ? error.message : "The session list could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSessions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setMessage("Universe checklist installed.");
    };
    window.addEventListener("beforeinstallprompt", handleInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const plannedSessions = useMemo(() => sessions.filter((session) => session.group === "plan"), [sessions]);
  const completedCount = plannedSessions.filter((session) => state.completed.includes(session.id)).length;
  const progressValue = plannedSessions.length ? Math.round((completedCount / plannedSessions.length) * 100) : 0;
  const focus = useMemo(() => getFocusState(sessions, state.completed, new Date(clock)), [sessions, state.completed, clock]);

  function persist(next: SavedState) {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMessage("");
    } catch {
      setMessage("This browser couldn't save your changes. Keep this page open to preserve them.");
    }
  }

  function setCompleted(session: Session, done: boolean) {
    const completed = done
      ? [...new Set([...state.completed, session.id])]
      : state.completed.filter((id) => id !== session.id);
    persist({ ...state, completed });
  }

  function setAvailability(session: Session, availability: Availability) {
    const nextAvailability = { ...state.availability };
    if (availability === "check") delete nextAvailability[session.id];
    else nextAvailability[session.id] = availability;
    persist({ ...state, availability: nextAvailability });
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function resetChecklist() {
    if (!window.confirm("Clear all checked sessions and availability tags on this device?")) return;
    persist({ completed: [], availability: {} });
  }

  const nextUp = focus.kind === "now" && focus.session
    ? `In progress · ${focus.session.title} · ${Math.max(0, timeToMinutes(focus.session.end) - focus.minute)} min left`
    : focus.kind === "next" && focus.session
      ? `Next up · ${focus.session.start} · in ${formatUntil(Math.max(1, Math.ceil((timestampFor(focus.session.day, focus.session.start) - focus.timestamp) / 60_000)))}`
      : completedCount === plannedSessions.length && plannedSessions.length > 0
        ? "Your planned sessions are all checked off."
        : "No upcoming planned sessions. Check off sessions you attended to update your progress.";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Universe checklist home">
          <span className="brand-mark" aria-hidden="true"><CalendarDays /></span>
          <span className="brand-label">Universe <span>'26</span><small>attendee checklist / unofficial</small></span>
        </a>
        <div className="header-actions">
          <Button className="round-button" variant="ghost" size="icon" aria-label={searchOpen ? "Close search" : "Search sessions"} aria-expanded={searchOpen} aria-controls="session-search" onClick={() => { if (searchOpen) setQuery(""); setSearchOpen(!searchOpen); }}>
            {searchOpen ? <X /> : <Search />}
          </Button>
          <Button className="round-button" variant="ghost" size="icon" aria-label="Checklist information" aria-expanded={settingsOpen} aria-controls="checklist-settings" onClick={() => setSettingsOpen(!settingsOpen)}>
            <Info />
          </Button>
        </div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <h1 id="page-title"><span className="intro-display">{view === "completed" ? "checked/" : view === "replays" ? "replays/" : "my-agenda/"}</span></h1>
        <p className="intro-meta">october 28–29 <span aria-hidden="true">/</span> san francisco, CA</p>
        <p className="intro-copy">Your platform engineering track.<br />Build skills here. Catch recordings later.</p>
      </section>

      {searchOpen && (
        <div className="search-panel" id="session-search">
          <Search aria-hidden="true" />
          <input autoFocus type="search" aria-label="Search sessions" placeholder="Find a session, topic, or venue" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      )}

      {settingsOpen && (
        <section className="settings-panel" id="checklist-settings" aria-label="Checklist information">
          <h2>Your Universe companion</h2>
          <p>Independent attendee tool. Not affiliated with or endorsed by GitHub. Some session display labels are shortened; official links show the current catalog details.</p>
          <p>Platform engineers, with selected security and engineering leadership sessions. All times are San Francisco time (PDT).</p>
          <p><strong>Availability is manual.</strong> Open, Full, and Standby are your notes after checking the official catalog, not live seat counts. Progress stays on this device.</p>
          <p>Replay labels are planning hints, not recording guarantees.</p>
          <Button asChild className="track-link"><a href={TRACK_URL} target="_blank" rel="noopener noreferrer">Platform engineers track <ArrowUpRight aria-hidden="true" /></a></Button>
          {installPrompt && <Button className="install-button" onClick={() => void installApp()}><Download aria-hidden="true" /> Install app</Button>}
          <Button variant="outline" onClick={resetChecklist}><RotateCcw aria-hidden="true" /> Reset checklist</Button>
        </section>
      )}

      {message && <p className="app-message" role="status">{message}</p>}

      <Tabs value={currentDay} onValueChange={(value) => { if (isDay(value)) setCurrentDay(value); }}>
        <TabsList aria-label="Choose a conference day" className="day-tabs">
          {DAYS.map((day) => (
            <TabsTrigger key={day.value} value={day.value} aria-label={day.label}>
              <span>{day.short === "WED" ? "Wednesday" : "Thursday"}</span>
              <time dateTime={day.value}>{day.date.replace("OCT ", "")}</time>
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS.map((day) => {
          const daySessions = sessions
            .filter((session) => session.day === day.value)
            .filter((session) => view === "agenda" || (view === "completed" ? state.completed.includes(session.id) : session.replay === "expected"))
            .filter((session) => `${session.title} ${session.venue} ${session.kind} ${session.why}`.toLowerCase().includes(query.trim().toLowerCase()))
            .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

          return (
            <TabsContent key={day.value} value={day.value} className="day-content">
              {loading ? (
                <p className="empty-state"><span className="loading-dot" /> Loading session plan…</p>
              ) : GROUPS.map((group) => {
                const groupSessions = daySessions.filter((session) => session.group === group.value);
                if (!groupSessions.length) return null;
                return (
                  <section key={group.value} className="session-group" aria-labelledby={`group-${day.value}-${group.value}`}>
                    <div className={cn("list-heading", group.value === "plan" && "list-heading--primary")}>
                      <h2 id={`group-${day.value}-${group.value}`}>{group.label}</h2>
                      <span>{groupSessions.length} {groupSessions.length === 1 ? "session" : "sessions"}</span>
                    </div>
                    <div className="session-list">
                      {groupSessions.map((session) => {
                        const focusKind = focus.session?.id === session.id ? focus.kind : "";
                        return (
                          <SessionCard
                            key={session.id}
                            session={session}
                            complete={state.completed.includes(session.id)}
                            availability={state.availability[session.id] ?? "check"}
                            focusKind={focusKind}
                            onCompleteChange={(done) => setCompleted(session, done)}
                            onAvailabilityChange={(availability) => setAvailability(session, availability)}
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              {!daySessions.length && !loading && (
                <p className="empty-state">{query ? "No matching sessions. Try another topic or clear your search." : view === "completed" ? "Nothing checked off yet. Your attended sessions will appear here." : view === "replays" ? "No likely replays on this day." : "No sessions are listed for this day."}</p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <section className="progress-panel" aria-label="Checklist progress">
        <div className="progress-head"><strong>{completedCount} / {plannedSessions.length}</strong><span>planned sessions checked off</span></div>
        <Progress aria-label="Planned sessions completed" value={progressValue} aria-valuetext={`${completedCount} of ${plannedSessions.length} planned sessions checked off`} className="progress-bar" />
        <p className="next-up" aria-live="polite">{loading ? "Loading your sessions…" : nextUp}</p>
      </section>
      <footer className="footer"><span>Independent attendee tool · not affiliated with GitHub</span><a href={TRACK_URL} target="_blank" rel="noopener noreferrer">Official track <ArrowUpRight aria-hidden="true" /></a></footer>
      <nav className="bottom-nav" aria-label="Checklist views">
        <Button variant="ghost" className={cn("nav-button", view === "agenda" && !settingsOpen && "nav-button--active")} aria-label="All sessions" aria-pressed={view === "agenda" && !settingsOpen} onClick={() => { setView("agenda"); setSettingsOpen(false); window.scrollTo({ top: 0 }); }}><Home /><span>Agenda</span></Button>
        <Button variant="ghost" className={cn("nav-button", view === "completed" && !settingsOpen && "nav-button--active")} aria-label="Checked sessions" aria-pressed={view === "completed" && !settingsOpen} onClick={() => { setView("completed"); setSettingsOpen(false); window.scrollTo({ top: 0 }); }}><ListChecks /><span>Checked</span></Button>
        <Button variant="ghost" className={cn("nav-button", view === "replays" && !settingsOpen && "nav-button--active")} aria-label="Likely replays" aria-pressed={view === "replays" && !settingsOpen} onClick={() => { setView("replays"); setSettingsOpen(false); window.scrollTo({ top: 0 }); }}><PlayCircle /><span>Replays</span></Button>
        <Button variant="ghost" className={cn("nav-button", settingsOpen && "nav-button--active")} aria-label="Checklist settings" aria-expanded={settingsOpen} aria-controls="checklist-settings" onClick={() => { setSettingsOpen(!settingsOpen); window.scrollTo({ top: 0 }); }}><SlidersHorizontal /><span>Settings</span></Button>
      </nav>
    </main>
  );
}

interface SessionCardProps {
  session: Session;
  complete: boolean;
  availability: Availability;
  focusKind: FocusKind;
  onCompleteChange: (done: boolean) => void;
  onAvailabilityChange: (availability: Availability) => void;
}

function SessionCard({
  session,
  complete,
  availability,
  focusKind,
  onCompleteChange,
  onAvailabilityChange,
}: SessionCardProps) {
  const Icon = getSessionIcon(session.kind);
  const statusOption = STATUS_OPTIONS.find((option) => option.value === availability);
  const sessionUrl = `${CATALOG_ROOT}${encodeURIComponent(session.catalogId)}`;

  return (
    <Card
      data-session-id={session.id}
      className={cn(
        "session-card",
        focusKind && "session-card--focus",
        complete && "session-card--done",
      )}
      aria-current={focusKind === "now" ? "time" : undefined}
    >
      <div className="session-face">
        <CardHeader className="session-card-header">
          <div className="session-topline">
            <div className="session-format"><span className="session-icon" aria-hidden="true"><Icon /></span><span>{session.kind}</span></div>
            <div className="badges">
              {focusKind && (
                <Badge className={cn("focus-badge", focusKind === "now" ? "focus-badge--now" : "focus-badge--next")}>
                  {focusKind === "now" ? "Happening now" : "Up next"}
                </Badge>
              )}
              {session.group === "optional" && <Badge variant="secondary">Optional</Badge>}
              {session.replay === "expected" && <Badge variant="outline" className="replay-badge">Replay likely</Badge>}
              {statusOption && availability !== "check" && (
                <Badge variant="outline" className={`status-badge status-badge--${availability}`}>
                  {availability === "open" ? <Check aria-hidden="true" /> : null}
                  {statusOption.label}
                </Badge>
              )}
            </div>
          </div>
        <div className="session-main">
          <CardTitle className="session-title">{session.title}</CardTitle>
          <a className="session-open" href={sessionUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open official session: ${session.title}`}><ArrowUpRight aria-hidden="true" /></a>
        </div>
        <p className="session-venue"><MapPin aria-hidden="true" /> {session.venue}</p>
        </CardHeader>
      </div>

      <CardFooter className="session-actions">
        <div className="done-control">
          <Checkbox
            id={`done-${session.id}`}
            checked={complete}
            onCheckedChange={(checked) => onCompleteChange(checked === true)}
            aria-label={`Mark ${session.title} ${complete ? "not done" : "done"}`}
          />
          <label htmlFor={`done-${session.id}`}>{complete ? "CHECKED" : "CHECK IN"}</label>
        </div>
        <div className="session-time"><strong>{session.start.replace(/ (AM|PM)$/u, "")}</strong><span>{session.start.endsWith("AM") ? "AM" : "PM"} · until {session.end}</span><time dateTime={session.day}>{session.day === "2026-10-28" ? "28" : "29"} October</time></div>
        <div className="availability-control">
          <label htmlFor={`availability-${session.id}`} className="sr-only">Availability for {session.title}</label>
          <Select
            value={availability}
            onValueChange={(value) => { if (isAvailability(value)) onAvailabilityChange(value); }}
          >
            <SelectTrigger id={`availability-${session.id}`} className={cn("availability-trigger", availability !== "check" && `availability-trigger--${availability}`)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardFooter>
      <details className="session-details">
        <summary>Why this session <span aria-hidden="true">+</span></summary>
        <p className="session-why">{session.why}</p>
        {session.transition && <p className="session-transition">{session.transition}</p>}
        <a className="session-link" href={sessionUrl} target="_blank" rel="noopener noreferrer">Official session <ArrowUpRight aria-hidden="true" /></a>
      </details>
    </Card>
  );
}

export default App;
