# A static site: the files are copied as they are into an unprivileged nginx. Nothing to build, so the pipeline builds and scans
# exactly what is shipped. The base image is pinned by digest (nginx mainline, slim: no extra modules) and Dependabot proposes updates.
# Build:  docker build -t clickers .

FROM nginxinc/nginx-unprivileged@sha256:09b0d3eda2aa592d2487f284519419015cab010d7df16cd0fe224b585fc60eb6
# The publisher rebuilds the base image only now and then: take the Alpine package fixes released since, so the image scan stays clean.
USER root
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./ /usr/share/nginx/html/
# The image's own unprivileged user (uid 101); stated last so the Dockerfile scan and the runtime agree.
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3   CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
