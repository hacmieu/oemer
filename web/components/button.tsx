import Link from "next/link";

type Variant = "primary" | "secondary";

/* Primary inverts ink and canvas rather than using the accent, so contrast
   stays far above AA in both themes. */
const styles: Record<Variant, string> = {
  primary:
    "bg-ink text-canvas hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40",
  secondary:
    "border border-line-strong text-ink hover:bg-sunken disabled:opacity-40 disabled:hover:bg-transparent",
};

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control " +
  "px-4 h-10 text-sm font-medium transition active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:active:translate-y-0";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function AnchorButton({
  variant = "primary",
  className = "",
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
