interface StateNoticeProps {
  title: string;
  message: string;
  tone?: 'neutral' | 'error';
}

export function StateNotice({ title, message, tone = 'neutral' }: StateNoticeProps) {
  return (
    <section className={`state-notice state-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
