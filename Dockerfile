FROM ubuntu:26.04

ENV DEBIAN_FRONTEND=noninteractive

# System dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        wget \
        nodejs \
        npm \
        imagemagick \
        libfreetype6  \
        fontconfig  \
        fonts-dejavu \
        fonts-liberation \
        webp \
    && fc-cache -f -v \
    && wget -qO /etc/apt/trusted.gpg.d/obs-openscad-nightly.asc https://files.openscad.org/OBS-Repository-Key.pub \
    && echo "deb https://download.opensuse.org/repositories/home:/t-paul/xUbuntu_26.04/ ./" > /etc/apt/sources.list.d/openscad-nightly.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends openscad-nightly \
    && apt-get purge -y --auto-remove wget \
    && apt-get clean \
    && rm -rf  /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install openscad-generate separately so changing VERSION
# does not invalidate the system dependency layer.
ARG VERSION=1.4.7
RUN npm install --global "openscad-generate@${VERSION}"
ENV AUTHENTICATION_PORT=42080

USER ubuntu
WORKDIR "/home/ubuntu/project"

VOLUME ["/home/ubuntu/project"]
EXPOSE 42080
ENTRYPOINT ["sh", "-c", "exec npx openscad-generate@${VERSION} unicorn-wait 3600"]
