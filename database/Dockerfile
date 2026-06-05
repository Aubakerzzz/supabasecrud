FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Install sqlcmd
RUN apt-get update && \
    apt-get install -y curl gnupg2 && \
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y mssql-tools18 unixodbc-dev && \
    apt-get clean

USER mssql

COPY init.sql /init.sql

USER root
RUN echo '#!/bin/bash\n\
/opt/mssql/bin/sqlservr &\n\
echo "Waiting for SQL Server to start..."\n\
sleep 30\n\
echo "Initializing database..."\n\
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$SA_PASSWORD" -i /init.sql\n\
echo "Database initialized successfully!"\n\
wait' > /entrypoint.sh && chmod +x /entrypoint.sh

USER mssql

EXPOSE 1433

ENTRYPOINT ["/entrypoint.sh"]