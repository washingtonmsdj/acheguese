import React from "react";
import { SafeLink } from "@/shared/components/security/SafeLink";
import {
  buildMailtoUrl,
  buildTelUrl,
  buildWebsiteUrl,
} from "@/shared/utils/contactLinks";

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
  const href = (() => {
    switch (type) {
      case "phone":
        return buildTelUrl(value);
      case "email":
        return buildMailtoUrl(value);
      case "website":
        return buildWebsiteUrl(value);
      default:
        return null;
    }
  })();

  const displayValue =
    type === "website"
      ? value.replace(/^https?:\/\//, "").replace(/\/$/, "")
      : value;

  if (!href) {
    return <span className={className}>{displayValue}</span>;
  }

  return (
    <SafeLink
      href={href}
      target={type === "website" ? "_blank" : undefined}
      className={className}
    >
      {displayValue}
    </SafeLink>
  );
};

export default ContactLink;
