import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
import type { SceneType, VideoScene } from "../lib/video-types";
import { sceneCrossfade, subtleParallax, textMotionPreset } from "./animation";
import { getSceneTheme } from "./theme";

const rootStyle: CSSProperties = {
  color: "#f8fafc",
  fontFamily:
    "Inter, Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  padding: 84
};

const titleStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 98,
  lineHeight: 1.03,
  letterSpacing: -2.4,
  textShadow: "0 10px 28px rgba(0, 0, 0, 0.45)"
};

const subStyle: CSSProperties = {
  marginTop: 18,
  fontSize: 42,
  lineHeight: 1.2,
  opacity: 0.96
};

const AnimatedUnderline = ({ accent }: { accent: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ fps, frame, config: { damping: 20, stiffness: 130, mass: 0.6 } });
  return (
    <div
      style={{
        margin: "22px auto 0",
        height: 6,
        width: `${interpolate(reveal, [0, 1], [8, 220])}px`,
        borderRadius: 999,
        background: accent
      }}
    />
  );
};

const SceneLayout = ({
  scene,
  screenshotBase64,
  sourceUrl,
  tone
}: {
  scene: VideoScene;
  screenshotBase64: string;
  sourceUrl: string;
  tone?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const transitionOpacity = sceneCrossfade(frame, scene.duration);
  const theme = getSceneTheme(scene.type, tone);
  const yOffset = subtleParallax(frame);
  const textMotion = textMotionPreset({
    style: scene.animation_style ?? "smooth-rise",
    frame,
    fps
  });

  return (
    <AbsoluteFill style={{ ...rootStyle, opacity: transitionOpacity, background: theme.gradient }}>
      <AbsoluteFill>
        <Img
          src={screenshotBase64}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: scene.type === "cta" ? 0.34 : 0.3,
            transform: `translateY(${yOffset}px) scale(${scene.type === "solution" ? 1.08 : 1.04})`
          }}
        />
        <AbsoluteFill style={{ background: theme.overlay }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 860,
            textAlign: "center",
            transform: `translateX(${textMotion.translateX}px) translateY(${textMotion.translateY}px) scale(${textMotion.scale})`,
            opacity: textMotion.opacity
          }}
        >
          <div style={titleStyle}>{scene.main_text}</div>
          <AnimatedUnderline accent={theme.accent} />
          <div style={subStyle}>{scene.sub_text}</div>

          {scene.type === "benefits" && scene.bullets.length > 0 ? (
            <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
              {scene.bullets.slice(0, 4).map((bullet, idx) => {
                const delaySpring = spring({
                  fps,
                  frame: Math.max(0, frame - idx * 7),
                  config: { damping: 16, stiffness: 150, mass: 0.7 }
                });
                return (
                  <div
                    key={`${bullet}-${idx}`}
                    style={{
                      fontSize: 34,
                      transform: `translateY(${interpolate(delaySpring, [0, 1], [12, 0])}px)`,
                      opacity: delaySpring
                    }}
                  >
                    • {bullet}
                  </div>
                );
              })}
            </div>
          ) : null}

          {scene.type === "cta" ? (
            <div style={{ marginTop: 16, fontSize: 30, color: "#dbeafe", opacity: 0.92 }}>{sourceUrl}</div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ScenePain = (props: {
  scene: VideoScene;
  screenshotBase64: string;
  sourceUrl: string;
  tone?: string;
}) => <SceneLayout {...props} />;

export const SceneSolution = (props: {
  scene: VideoScene;
  screenshotBase64: string;
  sourceUrl: string;
  tone?: string;
}) => <SceneLayout {...props} />;

export const SceneBenefits = (props: {
  scene: VideoScene;
  screenshotBase64: string;
  sourceUrl: string;
  tone?: string;
}) => <SceneLayout {...props} />;

export const SceneCta = (props: {
  scene: VideoScene;
  screenshotBase64: string;
  sourceUrl: string;
  tone?: string;
}) => <SceneLayout {...props} />;

export const pickSceneComponent = (type: SceneType) => {
  if (type === "pain") return ScenePain;
  if (type === "solution") return SceneSolution;
  if (type === "benefits") return SceneBenefits;
  return SceneCta;
};
