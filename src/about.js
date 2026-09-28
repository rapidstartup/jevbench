/** About page: copy button, contact form, support widget. */

import { initCopyButtons, observeMotion } from "./ui.js";
import "./support.js";

initCopyButtons();
observeMotion();

document.getElementById("contact-form")?.addEventListener("submit", (e) => {
  const form = e.target;
  const name = form.name.value?.trim() || "";
  const email = form.email.value?.trim() || "";
  const body = form.body.value?.trim() || "";
  const subject = encodeURIComponent(`JevBench contact from ${name || email}`);
  const mailBody = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${body}`);
  window.location.href = `mailto:hello@jevbench.dev?subject=${subject}&body=${mailBody}`;
  e.preventDefault();
});
