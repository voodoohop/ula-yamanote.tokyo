import {
  BoxGeometry,
  Cartesian3,
  Color,
  ColorGeometryInstanceAttribute,
  GeometryInstance,
  HeadingPitchRoll,
  Math as CesiumMath,
  Matrix4,
  PerInstanceColorAppearance,
  Primitive,
  ShadowMode,
  Transforms,
  VertexFormat,
} from 'cesium';
import type { RoutePose } from './yamanoteMotion';

const BODY_COLOR = Color.fromCssColorString('#c7ccd1');
const STRIPE_COLOR = Color.fromCssColorString('#9acd32');
const WINDOW_COLOR = Color.fromCssColorString('#ffd783');

function boxInstance(
  id: string,
  dimensions: Cartesian3,
  translation: Cartesian3,
  color: Color,
) {
  return new GeometryInstance({
    id,
    geometry: BoxGeometry.fromDimensions({
      dimensions,
      vertexFormat: VertexFormat.POSITION_AND_NORMAL,
    }),
    modelMatrix: Matrix4.fromTranslation(translation),
    attributes: {
      color: ColorGeometryInstanceAttribute.fromColor(color),
    },
  });
}

function createTrainGeometry() {
  const instances: GeometryInstance[] = [];

  for (let carriage = 0; carriage < 3; carriage += 1) {
    const offset = carriage * -17.4;
    instances.push(
      boxInstance(
        `carriage-${carriage}`,
        new Cartesian3(2.85, 16.8, 3.55),
        new Cartesian3(0, offset, 2.35),
        BODY_COLOR,
      ),
      boxInstance(
        `stripe-${carriage}`,
        new Cartesian3(2.89, 16.9, 0.32),
        new Cartesian3(0, offset, 2.15),
        STRIPE_COLOR,
      ),
      boxInstance(
        `window-left-${carriage}`,
        new Cartesian3(0.04, 12.4, 0.8),
        new Cartesian3(-1.44, offset, 3.05),
        WINDOW_COLOR,
      ),
      boxInstance(
        `window-right-${carriage}`,
        new Cartesian3(0.04, 12.4, 0.8),
        new Cartesian3(1.44, offset, 3.05),
        WINDOW_COLOR,
      ),
    );
  }

  return instances;
}

export class YamanoteTrainPrimitive {
  readonly primitive = new Primitive({
    geometryInstances: createTrainGeometry(),
    appearance: new PerInstanceColorAppearance({
      closed: true,
      flat: false,
      translucent: false,
    }),
    asynchronous: false,
    shadows: ShadowMode.ENABLED,
  });

  update(pose: RoutePose, elevation: number | undefined) {
    this.primitive.show = elevation !== undefined;
    if (elevation === undefined) return;

    const position = Cartesian3.fromDegrees(pose.lng, pose.lat, elevation + 0.6);
    this.primitive.modelMatrix = Transforms.headingPitchRollToFixedFrame(
      position,
      new HeadingPitchRoll(CesiumMath.toRadians(pose.bearing)),
    );
  }
}
