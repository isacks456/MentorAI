namespace MentorAI.API.Models
{
    public class LearningProfile
    {
        public int Id { get; set; }

        public string? ApplicationUserId { get; set; }

        public ApplicationUser? ApplicationUser { get; set; }

        public string Goal { get; set; } = "";

        public string Direction { get; set; } = "";

        public string Position { get; set; } = "";

        public string Description { get; set; } = "";

		public string DirectionDescription { get; set; } = "";

		public string PositionDescription { get; set; } = "";
    }
}