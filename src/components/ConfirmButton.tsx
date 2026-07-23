"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string };

export default function ConfirmButton({ message, children, ...props }: Props) {
  return (
    <button
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
