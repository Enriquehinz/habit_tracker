import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f5f7f2",
          color: "#08110d",
          display: "flex",
          fontSize: 68,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        HT
      </div>
    ),
    size,
  );
}
