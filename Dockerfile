# A static site: the files are copied as they are into an unprivileged nginx. Nothing to build, so the pipeline builds and scans
# exactly what is shipped. The base image is pinned by digest; Dependabot proposes updates.
# Build:  docker build -t clickers .

FROM nginxinc/nginx-unprivileged@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
