export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'generate_pass' | 'revoke_pass' | 'login' | 'click_gpt' | string;
  userEmail: string;
  details: string;
  metadata?: Record<string, any>;
}

/**
 * Add a new log entry to local_audit_logs in localStorage
 */
export function addAuditLog(
  action: 'generate_pass' | 'revoke_pass' | 'login' | 'click_gpt' | string,
  userEmail: string,
  details: string,
  metadata?: Record<string, any>
): void {
  try {
    const logsStr = localStorage.getItem('local_audit_logs');
    const logs: any[] = logsStr ? JSON.parse(logsStr) : [];

    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      userEmail: userEmail.toLowerCase().trim(),
      details,
      metadata
    };

    logs.unshift(newLog);
    localStorage.setItem('local_audit_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to add audit log:', err);
  }
}
