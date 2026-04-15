import React from "react";

interface ContactLinkProps {
  type: "phone" | "website" | "email";
  value: string;
  className?: string;
}

export const ContactLink: React.FC<ContactLinkProps> = ({
  type,
  value,
  className,
}) => {
  const getHref = () => {
    switch (type) {
      case "phone":
        return `tel:${value}`;
      case "email":
        return `mailto:${value}`;
      case "website":
        return value.startsWith("http") ? value : `https://${value}`;
      default:
        return value;
    }
  };

  const getDisplayValue = () => {
    switch (type) {
      case "website":
        return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
      default:
        return value;
    }
  };

  return (
    <a
      href={getHref()}
      target={type === "website" ? "_blank" : undefined}
      rel={type === "website" ? "noopener noreferrer" : undefined}
      className={className}
    >
      {getDisplayValue()}
    </a>
  );
};

export default ContactLink;
