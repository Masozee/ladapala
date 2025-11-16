"""
Custom email backend that uses certifi for SSL certificate verification
"""
import ssl
import certifi
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend


class EmailBackend(SMTPBackend):
    """
    Custom SMTP backend that uses certifi's certificate bundle
    This fixes SSL certificate verification issues on macOS
    """

    def open(self):
        """
        Ensure an open connection to the email server with proper SSL context
        """
        if self.connection:
            return False

        # Create SSL context with certifi's certificate bundle
        connection_params = {
            'timeout': self.timeout,
        }

        if self.use_ssl:
            connection_params['context'] = ssl.create_default_context(cafile=certifi.where())

        try:
            self.connection = self.connection_class(
                self.host,
                self.port,
                **connection_params
            )

            if self.use_tls:
                # Create SSL context for STARTTLS
                context = ssl.create_default_context(cafile=certifi.where())
                self.connection.starttls(context=context)

            if self.username and self.password:
                self.connection.login(self.username, self.password)

            return True
        except Exception:
            if not self.fail_silently:
                raise
            return False
