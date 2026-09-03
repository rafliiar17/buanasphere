/**
 * Kurs World — Custom Three.js GLSL Shaders for Single-Sphere LUT Globe (ADR 0038)
 * Renders 195+ countries in 1 single draw call with dynamic 256-color palette lookup.
 */

export const GLOBE_LUT_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GLOBE_LUT_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uCountryIdMap;     // 2D Equirectangular Map (R channel = Country ID 0..255)
  uniform sampler2D uPaletteLut;       // 1D Dynamic Palette LUT (256x1 RGBA)
  uniform float uHoveredId;            // ID of hovered country
  uniform float uSelectedId;           // ID of selected country
  uniform vec3 uHoverColor;            // Glowing emerald #34d399
  uniform vec3 uSelectColor;           // Glowing sky blue #38bdf8
  uniform vec4 uOceanColor;            // Deep space navy #0B0F19
  uniform float uAtmosphereGlow;       // Atmospheric rim intensity

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // 1. Sample the country ID from the equirectangular mask texture
    vec4 idSample = texture2D(uCountryIdMap, vUv);
    float countryIdFloat = floor(idSample.r * 255.0 + 0.5);
    int countryId = int(countryIdFloat);

    // 2. If ocean (ID 0), render ocean with deep ocean gradient
    if (countryId == 0) {
      // Subtle spherical rim lighting on ocean
      vec3 viewDir = normalize(-vPosition);
      float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
      vec3 ocean = uOceanColor.rgb + vec3(0.02, 0.08, 0.16) * pow(rim, 3.0);
      gl_FragColor = vec4(ocean, uOceanColor.a);
      return;
    }

    // 3. Sample country color from 1D Palette LUT
    float lutCoord = (countryIdFloat + 0.5) / 256.0;
    vec4 countryColor = texture2D(uPaletteLut, vec2(lutCoord, 0.5));

    // 4. Instant GPU Highlight for Selection & Hover
    if (abs(countryIdFloat - uSelectedId) < 0.5) {
      countryColor.rgb = mix(countryColor.rgb, uSelectColor, 0.85);
      countryColor.a = 1.0;
    } else if (abs(countryIdFloat - uHoveredId) < 0.5) {
      countryColor.rgb = mix(countryColor.rgb, uHoverColor, 0.80);
      countryColor.a = 1.0;
    }

    // 5. Atmosphere spherical Fresnel Rim Lighting
    vec3 viewDir = normalize(-vPosition);
    float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
    vec3 rimLight = vec3(0.02, 0.12, 0.22) * pow(fresnel, 2.5) * uAtmosphereGlow;
    countryColor.rgb += rimLight;

    gl_FragColor = countryColor;
  }
`;
