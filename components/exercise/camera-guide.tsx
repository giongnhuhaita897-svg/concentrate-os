import { Camera, PersonStanding, Ruler, ShieldCheck, Sun } from "lucide-react";

const TIPS = [
  {
    icon: Ruler,
    title: "Khoảng cách",
    text: "Đứng cách camera khoảng 1,5 đến 2 mét, sao cho thấy toàn thân từ đầu đến chân.",
  },
  {
    icon: Camera,
    title: "Vị trí đặt máy",
    text: "Đặt camera cố định ngang tầm ngực hoặc hông, không cầm tay và không nghiêng máy.",
  },
  {
    icon: PersonStanding,
    title: "Hướng đứng",
    text: "Bài ghi “Quay bên trái”: đứng nghiêng, vai trái hướng về camera. Bài ghi “Đối diện”: đứng thẳng mặt vào camera.",
  },
  {
    icon: Sun,
    title: "Ánh sáng và nền",
    text: "Bật đèn sáng đều phía trước, tránh ngược sáng. Mặc đồ khác màu với nền để máy nhận rõ khớp.",
  },
];

export function CameraGuide() {
  return (
    <section aria-labelledby="camera-guide-heading" className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="space-y-1">
        <h2 id="camera-guide-heading" className="text-xl font-semibold tracking-tight">
          Đặt camera cho đúng
        </h2>
        <p className="text-sm text-muted-foreground">
          Làm theo bốn điều này để máy đếm chính xác hơn.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIPS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        Hình ảnh chỉ được xử lý trên máy của bạn, không được tải lên đâu cả.
      </p>
    </section>
  );
}
