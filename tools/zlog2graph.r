png("zout.png", width=1920, height=1080);
zlog = read.csv("zlog.csv", header=TRUE);
data = na.omit(zlog$z_last_diff9);
plot(data, xlim=c(0, NROW(data)), ylim=c(min(data), max(data)), type="l");
dev.off();
