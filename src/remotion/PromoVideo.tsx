import { AbsoluteFill, Sequence } from "remotion";
import type { VideoBlueprint } from "./types";
import { pickSceneComponent } from "./scenes";

type PromoVideoProps = {
  blueprint: VideoBlueprint;
  screenshotBase64: string;
  sourceUrl: string;
  tone?: string;
};

export const PromoVideo = ({ blueprint, screenshotBase64, sourceUrl, tone }: PromoVideoProps) => {
  return (
    <AbsoluteFill>
      {blueprint.scenes.map((scene) => {
        const SceneComponent = pickSceneComponent(scene.type);
        return (
        <Sequence key={`${scene.type}-${scene.start}`} from={scene.start} durationInFrames={scene.duration}>
          <SceneComponent
            scene={scene}
            screenshotBase64={screenshotBase64}
            sourceUrl={sourceUrl}
            tone={tone}
          />
        </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
