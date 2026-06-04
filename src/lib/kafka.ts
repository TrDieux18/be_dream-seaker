import { Kafka } from "kafkajs";
import { Env } from "../config/env.config";

const kafka = new Kafka({
   clientId: "realtime-message-app",
   brokers: Env.KAFKA_BROKERS ? Env.KAFKA_BROKERS.split(",").map(b => b.trim()) : ["localhost:9092"],
});

export const kafkaProducer = kafka.producer();
export const kafkaConsumer = kafka.consumer({ groupId: "notification-group" });

export const connectKafka = async () => {
   try {
      // Auto-create topic if it doesn't exist
      const admin = kafka.admin();
      await admin.connect();
      const topics = await admin.listTopics();
      if (!topics.includes("notification-events")) {
         await admin.createTopics({
            topics: [{ topic: "notification-events", numPartitions: 1, replicationFactor: 1 }],
         });
         console.log("🆕 Created topic 'notification-events' programmatically");
      }
      await admin.disconnect();

      await kafkaProducer.connect();
      console.log("⚡ Kafka Producer connected successfully");

      await kafkaConsumer.connect();
      console.log("⚡ Kafka Consumer connected successfully");
   } catch (err) {
      console.error("❌ Kafka connection error:", err);
   }
};
