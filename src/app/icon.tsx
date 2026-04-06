import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#08110d",
          color: "#f5f7f2",
          display: "flex",
          fontSize: 74,
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
